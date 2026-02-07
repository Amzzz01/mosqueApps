'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Kawasan, Coordinates } from '@/types/kariah';
import { getActiveKawasan } from '@/lib/kawasan';
import { findKawasanByPoint } from '@/lib/pointInPolygon';
import { validateIC, validatePhoneNumber, autoFormatIC, autoFormatPhone } from '@/lib/validation';
import { MapPin, Loader2, Navigation, CheckCircle, AlertCircle, User, Send } from 'lucide-react';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RegistrationFormData {
  fullName: string;
  icNumber: string;
  phoneNumber: string;
  email: string;
  address: string;
  zone: string;
  zoneId: string;
  familyMembers: number | '';
}

const STEPS = [
  { key: 'location', label: 'Lokasi', icon: MapPin },
  { key: 'personal', label: 'Peribadi', icon: User },
  { key: 'submit', label: 'Hantar', icon: Send },
];

export default function KariahMapForm() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [kawasanList, setKawasanList] = useState<Kawasan[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [locating, setLocating] = useState(false);
  const [manualZone, setManualZone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isClient, setIsClient] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<RegistrationFormData>({
    defaultValues: {
      fullName: '',
      icNumber: '',
      phoneNumber: '',
      email: '',
      address: '',
      zone: '',
      zoneId: '',
      familyMembers: ''
    }
  });

  const zone = watch('zone');
  const fullName = watch('fullName');
  const icNumber = watch('icNumber');
  const phoneNumber = watch('phoneNumber');
  const email = watch('email');
  const address = watch('address');

  // Compute active step for progress indicator
  const locationDone = !!zone;
  const personalDone = !!fullName && !!icNumber && !!phoneNumber && !!email && !!address;
  const activeStep = submitSuccess ? 2 : personalDone && locationDone ? 2 : locationDone ? 1 : 0;

  // Fetch kawasan data
  useEffect(() => {
    setIsClient(true);
    getActiveKawasan()
      .then((data) => {
        setKawasanList(data);
        setLoadingMap(false);
      })
      .catch((err) => {
        console.error('Failed to load kawasan:', err);
        setLoadingMap(false);
      });
  }, []);

  // Place or move marker and detect zone
  const placeMarker = useCallback(
    (latlng: L.LatLng, map: L.Map) => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      const icon = L.divIcon({
        className: 'user-marker',
        html: `
          <div style="
            background-color: #10B981;
            border: 3px solid white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      markerRef.current = L.marker(latlng, { icon }).addTo(map);

      const point: Coordinates = { lat: latlng.lat, lng: latlng.lng };
      const kawasanForDetection = kawasanList.map((k) => ({
        id: k.id,
        boundaries: k.boundaries
      }));
      const foundId = findKawasanByPoint(point, kawasanForDetection);

      if (foundId) {
        const foundKawasan = kawasanList.find((k) => k.id === foundId);
        setValue('zone', foundKawasan?.name || '', { shouldValidate: true });
        setValue('zoneId', foundId, { shouldValidate: true });
      } else {
        setValue('zone', '', { shouldValidate: true });
        setValue('zoneId', '', { shouldValidate: true });
      }
    },
    [kawasanList, setValue]
  );

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || loadingMap) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([5.4141, 100.3288], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('click', (e: L.LeafletMouseEvent) => {
        placeMarker(e.latlng, map);
      });
    }

    const map = mapInstanceRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    kawasanList.forEach((kawasan) => {
      if (!kawasan.boundaries) return;

      const coordinates = kawasan.boundaries.coordinates[0].map(
        (coord: number[]) => [coord[1], coord[0]] as [number, number]
      );

      const polygon = L.polygon(coordinates, {
        color: kawasan.color,
        fillColor: kawasan.color,
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map);

      polygon.bindPopup(`
        <div style="padding: 4px;">
          <strong style="color: ${kawasan.color};">${kawasan.name}</strong>
        </div>
      `);
    });

    if (kawasanList.length > 0) {
      const allCoords: [number, number][] = [];
      kawasanList.forEach((k) => {
        if (k.boundaries) {
          k.boundaries.coordinates[0].forEach((coord: number[]) => {
            allCoords.push([coord[1], coord[0]]);
          });
        }
      });
      if (allCoords.length > 0) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [20, 20] });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, kawasanList, loadingMap, placeMarker]);

  // Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Pelayar anda tidak menyokong geolokasi.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng = L.latLng(latitude, longitude);
        const map = mapInstanceRef.current;

        if (map) {
          map.setView(latlng, 15);
          placeMarker(latlng, map);
        }
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Gagal mendapatkan lokasi anda. Sila pastikan kebenaran lokasi diaktifkan.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Form submission
  const onSubmit = async (data: RegistrationFormData) => {
    setSubmitting(true);
    setSubmitError('');

    try {
      await addDoc(collection(db, 'members'), {
        fullName: data.fullName.trim(),
        icNumber: data.icNumber.replace(/[\s-]/g, ''),
        phoneNumber: data.phoneNumber.replace(/[\s\-+]/g, ''),
        email: data.email.trim().toLowerCase(),
        address: data.address.trim(),
        zone: data.zone,
        zoneId: data.zoneId,
        familyMembers: data.familyMembers === '' ? 0 : Number(data.familyMembers),
        registeredAt: serverTimestamp(),
        status: 'pending'
      });

      setSubmitSuccess(true);
      reset();

      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError('Gagal menghantar pendaftaran. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3.5 rounded-xl border bg-white text-base ${
      hasError
        ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
        : 'border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500'
    } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`;

  /* ─── Map panel (reused in both mobile & desktop) ─── */
  const mapPanel = (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Pilih Lokasi Anda</h3>
          <p className="text-xs text-gray-500">
            Klik pada peta atau gunakan &quot;Cari Lokasi Saya&quot;
          </p>
        </div>
      </div>

      {loadingMap ? (
        <div className="w-full h-[280px] lg:h-[360px] bg-emerald-50 rounded-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-gray-500 text-sm">Memuatkan peta...</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-[280px] lg:h-[360px] rounded-2xl border-2 border-emerald-200 z-0"
          />

          {/* Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="absolute top-3 left-3 z-[1000] bg-white hover:bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all duration-200 border border-emerald-200"
          >
            {locating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {locating ? 'Mencari...' : 'Cari Lokasi Saya'}
          </button>

          {/* Legend */}
          {kawasanList.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 z-[1000] max-w-[180px] border border-emerald-100">
              <p className="font-bold text-xs mb-1.5 text-emerald-800">Kawasan:</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {kawasanList.map((kawasan) => (
                  <div key={kawasan.id} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: kawasan.color }}
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">{kawasan.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zone display */}
      {zone && (
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">
            Kawasan dikesan: <strong>{zone}</strong>
          </p>
        </div>
      )}

      {/* Zone manual selection (inside map panel) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Kawasan <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => {
              setManualZone(false);
              setValue('zone', '', { shouldValidate: false });
              setValue('zoneId', '', { shouldValidate: false });
            }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              !manualZone
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Kesan dari peta
          </button>
          <button
            type="button"
            onClick={() => {
              setManualZone(true);
              setValue('zone', '', { shouldValidate: false });
              setValue('zoneId', '', { shouldValidate: false });
            }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              manualZone
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Pilih manual
          </button>
        </div>

        {manualZone ? (
          <select
            className={inputClass(!!errors.zone)}
            {...register('zone', {
              required: 'Sila pilih kawasan anda'
            })}
            onChange={(e) => {
              const selected = kawasanList.find((k) => k.name === e.target.value);
              setValue('zone', e.target.value, { shouldValidate: true });
              setValue('zoneId', selected?.id || '', { shouldValidate: true });
            }}
          >
            <option value="">-- Pilih Kawasan --</option>
            {kawasanList.map((k) => (
              <option key={k.id} value={k.name}>
                {k.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            readOnly
            placeholder="Klik pada peta untuk mengesan kawasan anda"
            className={`${inputClass(!!errors.zone)} bg-emerald-50/50 cursor-not-allowed`}
            {...register('zone', {
              required: 'Sila klik pada peta untuk menentukan kawasan anda'
            })}
          />
        )}

        <input type="hidden" {...register('zoneId')} />
        {errors.zone && (
          <p className="mt-1 text-sm text-red-500">{errors.zone.message}</p>
        )}
      </div>
    </div>
  );

  /* ─── Form fields panel ─── */
  const formPanel = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
          <User className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Maklumat Peribadi</h3>
      </div>

      {/* Success */}
      {submitSuccess && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Pendaftaran berjaya dihantar!</p>
            <p className="text-xs text-emerald-600 mt-1">
              Permohonan anda akan disemak oleh pihak pentadbir. Terima kasih.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Nama Penuh <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Nama seperti dalam IC"
          className={inputClass(!!errors.fullName)}
          {...register('fullName', { required: 'Nama penuh diperlukan' })}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      {/* IC & Phone — side by side on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            No. Kad Pengenalan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="890101-01-1234"
            className={inputClass(!!errors.icNumber)}
            {...register('icNumber', {
              required: 'No. IC diperlukan',
              validate: (value) =>
                validateIC(value) || 'Format IC tidak sah',
              onChange: (e) => {
                e.target.value = autoFormatIC(e.target.value);
              }
            })}
          />
          {errors.icNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.icNumber.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            No. Telefon <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="012-3456789"
            className={inputClass(!!errors.phoneNumber)}
            {...register('phoneNumber', {
              required: 'No. telefon diperlukan',
              validate: (value) =>
                validatePhoneNumber(value) || 'Format tidak sah',
              onChange: (e) => {
                e.target.value = autoFormatPhone(e.target.value);
              }
            })}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          E-mel <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          placeholder="contoh@email.com"
          className={inputClass(!!errors.email)}
          {...register('email', {
            required: 'E-mel diperlukan',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Format e-mel tidak sah'
            }
          })}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Alamat Penuh <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          placeholder="Alamat rumah lengkap"
          className={inputClass(!!errors.address)}
          {...register('address', { required: 'Alamat diperlukan' })}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      {/* Family Members */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Bilangan Ahli Keluarga
        </label>
        <input
          type="number"
          min="0"
          placeholder="0"
          className={inputClass(false)}
          {...register('familyMembers', {
            min: { value: 0, message: 'Tidak boleh kurang dari 0' }
          })}
        />
        {errors.familyMembers && (
          <p className="mt-1 text-sm text-red-500">{errors.familyMembers.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 px-8 rounded-xl text-base transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2.5"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Menghantar...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Hantar Pendaftaran
          </>
        )}
      </button>
    </form>
  );

  /* ─── Progress stepper (desktop only, inside left column) ─── */
  const stepper = (
    <div className="hidden lg:flex flex-col items-center gap-0 pt-2">
      {STEPS.map((step, i) => {
        const done = i < activeStep;
        const current = i === activeStep;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex flex-col items-center">
            {/* Connector line above (skip for first) */}
            {i > 0 && (
              <div
                className={`w-0.5 h-8 transition-colors duration-500 ${
                  done ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
            {/* Circle */}
            <div
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                done
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : current
                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {done ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            {/* Label */}
            <span
              className={`text-[10px] font-semibold mt-1 ${
                done || current ? 'text-emerald-700' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ─── MOBILE / TABLET: stacked single-column ─── */}
      <div className="lg:hidden p-5 sm:p-8 space-y-8">
        {mapPanel}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
        {formPanel}
      </div>

      {/* ─── DESKTOP: two-column with sticky map ─── */}
      <div className="hidden lg:flex">
        {/* Progress stepper rail */}
        <div className="flex-shrink-0 w-16 bg-gray-50/80 border-r border-emerald-100 flex justify-center py-10">
          {stepper}
        </div>

        {/* Left column — sticky map */}
        <div className="w-[42%] flex-shrink-0 border-r border-emerald-100">
          <div className="sticky top-0 max-h-screen overflow-y-auto p-8 space-y-4">
            {mapPanel}
          </div>
        </div>

        {/* Right column — scrollable form */}
        <div className="flex-1 min-w-0 p-8 lg:p-10">
          {formPanel}
        </div>
      </div>
    </>
  );
}
