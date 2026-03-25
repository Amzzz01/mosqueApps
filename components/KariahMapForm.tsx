'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useForm } from 'react-hook-form';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Kawasan, Coordinates } from '@/types/kariah';
import { getActiveKawasan } from '@/lib/kawasan';
import { findKawasanByPoint } from '@/lib/pointInPolygon';
import { validateIC, validatePhoneNumber, autoFormatIC, autoFormatPhone, getBirthDateFromIC } from '@/lib/validation';
import { MapPin, Loader2, Navigation, CheckCircle, AlertCircle, User, Send, Home, Phone, Mail, Users } from 'lucide-react';

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
      const map = L.map(mapRef.current, {
        keyboard: false,
      }).setView([5.4141, 100.3288], 13);

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
      const cleanIC = data.icNumber.replace(/[\s-]/g, '');
      const birthDate = getBirthDateFromIC(cleanIC);
      // Malaysian IC: last digit odd = Lelaki, even = Perempuan
      const lastDigit = parseInt(cleanIC.charAt(11), 10);
      const jantina = lastDigit % 2 === 1 ? 'Lelaki' : 'Perempuan';

      await addDoc(collection(db, 'anakKariah'), {
        namaPenuh: data.fullName.trim(),
        ic: cleanIC,
        telefon: data.phoneNumber.replace(/[\s\-+]/g, ''),
        email: data.email.trim().toLowerCase(),
        alamat: data.address.trim(),
        kawasanName: data.zone,
        kawasanId: data.zoneId,
        jantina,
        tarikhLahir: birthDate ? Timestamp.fromDate(birthDate) : null,
        coordinates: null,
        detectionMethod: 'manual',
        autoDetectedKawasan: null,
        familyMembers: data.familyMembers === '' ? 0 : Number(data.familyMembers),
        status: 'aktif',
        activatedBy: 'Pendaftaran Awam',
        activatedAt: serverTimestamp(),
        deactivatedBy: null,
        deactivatedAt: null,
        lastModifiedBy: 'Pendaftaran Awam',
        lastModifiedAt: serverTimestamp(),
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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

  // Scroll focused input into view when mobile keyboard opens
  const scrollToInput = useCallback((e: React.FocusEvent<HTMLElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  // Input styles — white on both mobile and desktop, responsive borders
  const inputClass = (hasError: boolean) =>
    `w-full max-w-full min-w-0 px-4 py-3 lg:py-3.5 rounded-2xl lg:rounded-xl border bg-white text-sm lg:text-base text-gray-900 ${
      hasError
        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
        : 'border-white/60 focus:ring-emerald-400 focus:border-emerald-400 lg:border-emerald-200 lg:focus:ring-emerald-500 lg:focus:border-emerald-500'
    } focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400`;

  const selectClass = (hasError: boolean) =>
    `${inputClass(hasError)} appearance-none bg-no-repeat bg-[length:16px_16px] bg-[right_12px_center] pr-10 bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")]`;

  /* ─── Mobile field label ─── */
  const mobileLabel = (text: string, required?: boolean) => (
    <label className="block text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal">
      {text} {required && <span className="text-red-400 lg:text-red-500">*</span>}
    </label>
  );

  /* ─── Map panel ─── */
  const mapPanel = (
    <div className="space-y-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white lg:text-base lg:text-gray-900">Pilih Lokasi Anda</h3>
          <p className="text-[11px] text-emerald-200/60 lg:text-xs lg:text-gray-500">
            Klik pada peta atau gunakan &quot;Cari Lokasi Saya&quot;
          </p>
        </div>
      </div>

      {loadingMap ? (
        <div className="w-full h-[260px] lg:h-[360px] bg-emerald-900/30 lg:bg-emerald-50 rounded-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-emerald-400 lg:text-emerald-600 animate-spin" />
            <p className="text-emerald-300/70 lg:text-gray-500 text-sm">Memuatkan peta...</p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl">
          <div
            ref={mapRef}
            tabIndex={-1}
            className="w-full h-[260px] lg:h-[360px] border-2 border-white/20 lg:border-emerald-200 z-0"
          />

          {/* Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="absolute top-3 left-3 z-[1000] bg-white hover:bg-emerald-50 text-emerald-700 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl shadow-lg text-xs lg:text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all duration-200 border border-emerald-200"
          >
            {locating ? (
              <Loader2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            )}
            {locating ? 'Mencari...' : 'Lokasi Saya'}
          </button>

          {/* Legend */}
          {kawasanList.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-white/95 rounded-xl shadow-lg p-2.5 lg:p-3 z-[1000] max-w-[160px] lg:max-w-[180px] border border-emerald-100">
              <p className="font-bold text-[10px] lg:text-xs mb-1 lg:mb-1.5 text-emerald-800">Kawasan:</p>
              <div className="space-y-1 max-h-24 lg:max-h-28 overflow-y-auto">
                {kawasanList.map((kawasan) => (
                  <div key={kawasan.id} className="flex items-center gap-1.5 lg:gap-2">
                    <div
                      className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: kawasan.color }}
                    />
                    <span className="text-[10px] text-gray-600 leading-tight">{kawasan.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zone detected */}
      {zone && (
        <div className="p-3 bg-emerald-400/15 border border-emerald-400/25 lg:bg-gradient-to-r lg:from-emerald-50 lg:to-teal-50 lg:border-emerald-200 rounded-xl flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400 lg:text-emerald-600 flex-shrink-0" />
          <p className="text-xs lg:text-sm text-emerald-300 lg:text-emerald-700">
            Kawasan dikesan: <strong>{zone}</strong>
          </p>
        </div>
      )}

      {/* Zone selection */}
      <div>
        {mobileLabel('Kawasan', true)}
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => {
              setManualZone(false);
              setValue('zone', '', { shouldValidate: false });
              setValue('zoneId', '', { shouldValidate: false });
            }}
            className={`text-xs px-3 py-2 min-h-[40px] rounded-full font-medium transition-colors ${
              !manualZone
                ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40 lg:bg-emerald-100 lg:text-emerald-700 lg:ring-emerald-300'
                : 'bg-white/10 text-white/50 hover:bg-white/15 lg:bg-gray-100 lg:text-gray-500 lg:hover:bg-gray-200'
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
            className={`text-xs px-3 py-2 min-h-[40px] rounded-full font-medium transition-colors ${
              manualZone
                ? 'bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-400/40 lg:bg-emerald-100 lg:text-emerald-700 lg:ring-emerald-300'
                : 'bg-white/10 text-white/50 hover:bg-white/15 lg:bg-gray-100 lg:text-gray-500 lg:hover:bg-gray-200'
            }`}
          >
            Pilih manual
          </button>
        </div>

        {manualZone ? (
          <select
            className={selectClass(!!errors.zone)}
            onFocus={scrollToInput}
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
            placeholder="Klik pada peta untuk mengesan kawasan"
            className={`${inputClass(!!errors.zone)} bg-white/70 lg:bg-emerald-50/50 cursor-not-allowed`}
            {...register('zone', {
              required: 'Sila klik pada peta untuk menentukan kawasan anda'
            })}
          />
        )}

        <input type="hidden" {...register('zoneId')} />
        {errors.zone && (
          <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.zone.message}</p>
        )}
      </div>
    </div>
  );

  /* ─── Form fields panel ─── */
  const formPanel = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
          <User className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-white lg:text-base lg:text-gray-900">Maklumat Peribadi</h3>
      </div>

      {/* Success */}
      {submitSuccess && (
        <div className="p-3.5 bg-emerald-400/15 border border-emerald-400/25 lg:bg-gradient-to-r lg:from-emerald-50 lg:to-teal-50 lg:border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 lg:text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-emerald-300 lg:text-sm lg:text-emerald-800">Pendaftaran berjaya dihantar!</p>
            <p className="text-[11px] text-emerald-400/70 lg:text-xs lg:text-emerald-600 mt-0.5">
              Permohonan anda akan disemak oleh pihak pentadbir. Terima kasih.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {submitError && (
        <div className="p-3.5 bg-red-500/15 border border-red-400/25 lg:bg-red-50 lg:border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 lg:text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 lg:text-sm lg:text-red-700">{submitError}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal lg:gap-0">
          <User className="w-3 h-3 lg:hidden" />
          Nama Penuh <span className="text-red-400 lg:text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="text"
          autoComplete="name"
          placeholder="Nama seperti dalam IC"
          className={inputClass(!!errors.fullName)}
          onFocus={scrollToInput}
          {...register('fullName', { required: 'Nama penuh diperlukan' })}
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      {/* IC & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal">
            No. IC <span className="text-red-400 lg:text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="890101-01-1234"
            className={inputClass(!!errors.icNumber)}
            onFocus={scrollToInput}
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
            <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.icNumber.message}</p>
          )}
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal">
            <Phone className="w-3 h-3 lg:hidden" />
            No. Telefon <span className="text-red-400 lg:text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="tel"
            autoComplete="tel"
            placeholder="012-3456789"
            className={inputClass(!!errors.phoneNumber)}
            onFocus={scrollToInput}
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
            <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal">
          <Mail className="w-3 h-3 lg:hidden" />
          E-mel <span className="text-red-400 lg:text-red-500 ml-0.5">*</span>
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="contoh@email.com"
          className={inputClass(!!errors.email)}
          onFocus={scrollToInput}
          {...register('email', {
            required: 'E-mel diperlukan',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Format e-mel tidak sah'
            }
          })}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal">
          <Home className="w-3 h-3 lg:hidden" />
          Alamat Penuh <span className="text-red-400 lg:text-red-500 ml-0.5">*</span>
        </label>
        <textarea
          rows={3}
          autoComplete="street-address"
          placeholder="Alamat rumah lengkap"
          className={inputClass(!!errors.address)}
          onFocus={scrollToInput}
          {...register('address', { required: 'Alamat diperlukan' })}
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.address.message}</p>
        )}
      </div>

      {/* Family Members */}
      <div>
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/65 uppercase tracking-wide mb-1.5 lg:text-sm lg:font-semibold lg:text-gray-700 lg:normal-case lg:tracking-normal">
          <Users className="w-3 h-3 lg:hidden" />
          Bilangan Ahli Keluarga
        </label>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="0"
          className={inputClass(false)}
          onFocus={scrollToInput}
          {...register('familyMembers', {
            min: { value: 0, message: 'Tidak boleh kurang dari 0' }
          })}
        />
        {errors.familyMembers && (
          <p className="mt-1 text-xs text-red-300 lg:text-sm lg:text-red-500">{errors.familyMembers.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 lg:py-4 px-8 rounded-2xl lg:rounded-xl text-sm lg:text-base transition-all duration-300 shadow-lg shadow-emerald-900/40 hover:shadow-emerald-800/60 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
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
            {i > 0 && (
              <div
                className={`w-0.5 h-8 transition-colors duration-500 ${
                  done ? 'bg-emerald-400' : 'bg-gray-200'
                }`}
              />
            )}
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
    <div className="flex flex-col lg:flex-row lg:gap-0">

      {/* ── Mobile step pills ── */}
      <div className="lg:hidden flex items-center gap-2 px-4 pt-4 pb-2">
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              {i > 0 && (
                <div className={`flex-1 h-px ${done ? 'bg-emerald-400' : 'bg-white/15'}`} />
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${
                done
                  ? 'bg-emerald-400/20 text-emerald-300'
                  : current
                  ? 'bg-white/15 text-white ring-1 ring-white/25'
                  : 'bg-white/5 text-white/30'
              }`}>
                {done ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop stepper rail ── */}
      <div className="hidden lg:flex flex-shrink-0 w-16 bg-gray-50/80 border-r border-emerald-100 justify-center py-10">
        {stepper}
      </div>

      {/* ── Map panel ── */}
      <div className="min-w-0 lg:w-[42%] lg:flex-shrink-0 lg:border-r lg:border-emerald-100">
        <div className="px-3 pt-2 lg:px-0 lg:pt-0 lg:p-8 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
          {/* Mobile card */}
          <div className="bg-black/20 rounded-2xl border border-white/8 p-4 lg:bg-transparent lg:rounded-none lg:border-0 lg:p-0">
            {mapPanel}
          </div>
        </div>
      </div>

      {/* ── Divider (desktop only, between map and form) ── */}
      <div className="hidden lg:block h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent mx-5 sm:mx-8" />

      {/* ── Form panel ── */}
      <div className="flex-1 min-w-0">
        <div className="px-3 pt-2 pb-10 lg:px-0 lg:pt-0 lg:p-10 lg:pb-10">
          {/* Mobile card */}
          <div className="bg-black/20 rounded-2xl border border-white/8 p-4 lg:bg-transparent lg:rounded-none lg:border-0 lg:p-0">
            {formPanel}
          </div>
        </div>
      </div>

    </div>
  );
}
