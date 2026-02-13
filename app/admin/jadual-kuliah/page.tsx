// app/admin/jadual-kuliah/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Edit, Trash2, Search, Filter, CheckCircle, XCircle,
  BookOpen, GripVertical, Palette, Tag,
} from 'lucide-react';
import {
  getAllJadualKuliah, deleteJadualKuliah, toggleJadualKuliahStatus, updateJadualSequences,
  getAllKategori, createKategori, updateKategori, deleteKategori, updateKategoriSequences,
} from '@/lib/jadualKuliah';
import { JadualKuliah, KategoriKuliah } from '@/types';
import toast from 'react-hot-toast';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DAYS = ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'];

function formatTime(item: JadualKuliah): string {
  if (item.timeType === 'fixed' && item.fixedTime) return item.fixedTime;
  if (item.timeType === 'afterPrayer' && item.prayerReference) {
    const min = item.minutesAfterPrayer ?? 0;
    return min > 0
      ? `Selepas ${item.prayerReference} ${min} minit`
      : `Selepas ${item.prayerReference}`;
  }
  return '-';
}

function formatWeek(weeks: string[]): string {
  if (!weeks || weeks.length === 0) return '-';
  if (weeks.includes('Semua')) return 'Setiap Minggu';
  return `Minggu ${weeks.join(', ')}`;
}

// ─── Sortable Kuliah Card ───
function SortableKuliahCard({
  item, kategoriList, onToggle, onDelete,
}: {
  item: JadualKuliah;
  kategoriList: KategoriKuliah[];
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id!,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const kat = kategoriList.find(k => k.name === item.category);

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
            title="Seret untuk susun semula"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          {item.posterUrl && (
            <div className="flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={item.posterUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                {kat && (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full font-medium text-white"
                    style={{ backgroundColor: kat.color }}
                  >
                    {kat.name}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  item.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.isActive ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p><span className="font-medium">Ustaz:</span> {item.ustaz}</p>
              <p><span className="font-medium">Hari:</span> {item.day}</p>
              <p><span className="font-medium">Masa:</span> {formatTime(item)}</p>
              <p><span className="font-medium">Minggu:</span> {formatWeek(item.weekOfMonth)}</p>
              <p><span className="font-medium">Tempat:</span> {item.venue}</p>
            </div>

            {item.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
            )}

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => onToggle(item.id!, item.isActive)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  item.isActive
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {item.isActive ? (
                  <><XCircle className="h-4 w-4" /><span>Nyahaktif</span></>
                ) : (
                  <><CheckCircle className="h-4 w-4" /><span>Aktifkan</span></>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/admin/jadual-kuliah/${item.id}/edit`}
                  className="text-emerald-600 hover:text-emerald-900 p-2"
                  title="Edit"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => onDelete(item.id!, item.title)}
                  className="text-red-600 hover:text-red-900 p-2"
                  title="Padam"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Kategori Row ───
function SortableKategoriRow({
  item, onEdit, onDelete,
}: {
  item: KategoriKuliah;
  onEdit: (k: KategoriKuliah) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id!,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 border border-gray-200"
        style={{ backgroundColor: item.color }}
      />
      <span className="flex-1 font-medium text-gray-900">{item.name}</span>
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        item.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {item.isActive ? 'Aktif' : 'Tidak Aktif'}
      </span>
      <button onClick={() => onEdit(item)} className="text-emerald-600 hover:text-emerald-900 p-1.5" title="Edit">
        <Edit className="h-4 w-4" />
      </button>
      <button onClick={() => onDelete(item.id!, item.name)} className="text-red-600 hover:text-red-900 p-1.5" title="Padam">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Page ───
export default function JadualKuliahListPage() {
  const [activeTab, setActiveTab] = useState<'jadual' | 'kategori'>('jadual');
  const [jadualList, setJadualList] = useState<JadualKuliah[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriKuliah[]>([]);
  const [filtered, setFiltered] = useState<JadualKuliah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  // Kategori form state
  const [showKatForm, setShowKatForm] = useState(false);
  const [editingKat, setEditingKat] = useState<KategoriKuliah | null>(null);
  const [katName, setKatName] = useState('');
  const [katColor, setKatColor] = useState('#10b981');
  const [katActive, setKatActive] = useState(true);
  const [katSaving, setKatSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    try {
      const [jadual, kategori] = await Promise.all([
        getAllJadualKuliah(),
        getAllKategori(),
      ]);
      setJadualList(jadual);
      setKategoriList(kategori);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuatkan data';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = [...jadualList];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        k => k.title.toLowerCase().includes(term) || k.ustaz.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(k => k.category === categoryFilter);
    }
    if (dayFilter !== 'all') {
      result = result.filter(k => k.day === dayFilter);
    }
    setFiltered(result);
  }, [searchTerm, categoryFilter, dayFilter, jadualList]);

  // ── Jadual handlers ──
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleJadualKuliahStatus(id, !isActive);
      toast.success(isActive ? 'Kuliah dinyahaktifkan' : 'Kuliah diaktifkan');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengemas kini status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam kuliah "${title}"?`)) return;
    try {
      await deleteJadualKuliah(id);
      toast.success('Kuliah berjaya dipadam');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memadam kuliah');
    }
  };

  const handleJadualDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex(i => i.id === active.id);
    const newIndex = filtered.findIndex(i => i.id === over.id);
    const reordered = arrayMove(filtered, oldIndex, newIndex);

    setFiltered(reordered);
    setJadualList(prev => {
      const others = prev.filter(i => !reordered.find(r => r.id === i.id));
      return [...reordered, ...others];
    });

    try {
      await updateJadualSequences(reordered.map((item, idx) => ({ id: item.id!, sequence: idx })));
    } catch (err) {
      toast.error('Gagal menyimpan susunan');
      fetchData();
    }
  };

  // ── Kategori handlers ──
  const openKatForm = (kat?: KategoriKuliah) => {
    if (kat) {
      setEditingKat(kat);
      setKatName(kat.name);
      setKatColor(kat.color);
      setKatActive(kat.isActive);
    } else {
      setEditingKat(null);
      setKatName('');
      setKatColor('#10b981');
      setKatActive(true);
    }
    setShowKatForm(true);
  };

  const handleKatSubmit = async () => {
    if (!katName.trim()) { toast.error('Sila masukkan nama kategori'); return; }
    setKatSaving(true);
    try {
      if (editingKat) {
        await updateKategori(editingKat.id!, { name: katName.trim(), color: katColor, isActive: katActive });
        toast.success('Kategori berjaya dikemaskini');
      } else {
        await createKategori({
          name: katName.trim(),
          color: katColor,
          sequence: kategoriList.length,
          isActive: katActive,
        });
        toast.success('Kategori berjaya ditambah');
      }
      setShowKatForm(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan kategori');
    } finally {
      setKatSaving(false);
    }
  };

  const handleKatDelete = async (id: string, name: string) => {
    if (!confirm(`Adakah anda pasti mahu memadam kategori "${name}"?`)) return;
    try {
      await deleteKategori(id);
      toast.success('Kategori berjaya dipadam');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memadam kategori');
    }
  };

  const handleKatDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = kategoriList.findIndex(i => i.id === active.id);
    const newIndex = kategoriList.findIndex(i => i.id === over.id);
    const reordered = arrayMove(kategoriList, oldIndex, newIndex);
    setKategoriList(reordered);

    try {
      await updateKategoriSequences(reordered.map((item, idx) => ({ id: item.id!, sequence: idx })));
    } catch (err) {
      toast.error('Gagal menyimpan susunan');
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Memuatkan jadual kuliah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Pengurusan Jadual Kuliah</h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'jadual'
              ? `Jumlah: ${filtered.length} kuliah`
              : `Jumlah: ${kategoriList.length} kategori`}
          </p>
        </div>
        {activeTab === 'jadual' && (
          <Link
            href="/admin/jadual-kuliah/new"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Tambah Kuliah
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('jadual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'jadual'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Jadual Kuliah
        </button>
        <button
          onClick={() => setActiveTab('kategori')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'kategori'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="h-4 w-4" />
          Kategori
        </button>
      </div>

      {/* ═══ Jadual Tab ═══ */}
      {activeTab === 'jadual' && (
        <>
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari tajuk atau ustaz..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
            {/* Category filter */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Kategori</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Semua
                </button>
                {kategoriList.map(kat => (
                  <button
                    key={kat.id}
                    onClick={() => setCategoryFilter(kat.name)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                      categoryFilter === kat.name
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={categoryFilter === kat.name ? { backgroundColor: kat.color } : {}}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: kat.color }}
                    />
                    {kat.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Day filter */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Hari</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDayFilter('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    dayFilter === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Semua
                </button>
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => setDayFilter(day)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      dayFilter === day
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kuliah Grid with DnD */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tiada kuliah dijumpai</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleJadualDragEnd}>
              <SortableContext items={filtered.map(i => i.id!)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map(item => (
                    <SortableKuliahCard
                      key={item.id}
                      item={item}
                      kategoriList={kategoriList}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

      {/* ═══ Kategori Tab ═══ */}
      {activeTab === 'kategori' && (
        <div className="space-y-4">
          {/* Add button */}
          <button
            onClick={() => openKatForm()}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Tambah Kategori
          </button>

          {/* Kategori form modal */}
          {showKatForm && (
            <div className="bg-white rounded-lg shadow-sm border p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">
                {editingKat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input
                    type="text"
                    value={katName}
                    onChange={e => setKatName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="cth: Al-Quran"
                    disabled={katSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={katColor}
                      onChange={e => setKatColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                      disabled={katSaving}
                    />
                    <input
                      type="text"
                      value={katColor}
                      onChange={e => setKatColor(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      disabled={katSaving}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="katActive"
                  type="checkbox"
                  checked={katActive}
                  onChange={e => setKatActive(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  disabled={katSaving}
                />
                <label htmlFor="katActive" className="text-sm text-gray-700">Aktif</label>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleKatSubmit}
                  disabled={katSaving}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {katSaving ? 'Menyimpan...' : editingKat ? 'Kemaskini' : 'Simpan'}
                </button>
                <button
                  onClick={() => setShowKatForm(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Kategori list with DnD */}
          {kategoriList.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Tiada kategori dijumpai</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleKatDragEnd}>
              <SortableContext items={kategoriList.map(i => i.id!)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {kategoriList.map(kat => (
                    <SortableKategoriRow
                      key={kat.id}
                      item={kat}
                      onEdit={openKatForm}
                      onDelete={handleKatDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}
