import React, { useState, useRef, useEffect } from 'react';
import { Camera, Home, User, Plus, ChevronDown, X, Check, Image as ImageIcon, Tag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Photo } from './types';

export default function App() {
  const [view, setView] = useState<'home' | 'capture' | 'gallery' | 'profile' | 'manage'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [gallery, setGallery] = useState<Photo[]>([]);
  
  // Gallery Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // Photo details state
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0] || null;

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !currentProjectId) {
        setCurrentProjectId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch('/api/photos');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setGallery(data);
    } catch (err) {
      console.error('Error fetching photos:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (currentProject) {
      setSelectedPhase(currentProject.phases[0] || '');
      setSelectedZone(currentProject.zones[0] || '');
    }
  }, [currentProjectId, projects]);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedPhoto(reader.result as string);
        setView('capture');
      };
      reader.readAsDataURL(file);
    }
  };

  const addProject = async () => {
    const name = prompt('Nombre del nuevo proyecto:');
    if (name) {
      const id = Date.now().toString();
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name })
      });
      await fetchProjects();
      setCurrentProjectId(id);
      setIsProjectMenuOpen(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (projects.length <= 1) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      await fetchProjects();
      if (currentProjectId === id) {
        const other = projects.find(p => p.id !== id);
        if (other) setCurrentProjectId(other.id);
      }
    }
  };

  const addPhase = async (projId: string) => {
    const name = prompt('Nombre de la nueva fase:');
    if (name) {
      await fetch(`/api/projects/${projId}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      await fetchProjects();
      if (projId === currentProjectId) setSelectedPhase(name);
    }
  };

  const addZone = async (projId: string) => {
    const name = prompt('Nombre de la nueva zona:');
    if (name) {
      await fetch(`/api/projects/${projId}/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      await fetchProjects();
      if (projId === currentProjectId) setSelectedZone(name);
    }
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const savePhoto = async () => {
    if (capturedPhoto) {
      // Convert base64 to blob
      const res = await fetch(capturedPhoto);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append('photo', blob, 'capture.jpg');
      formData.append('projectId', currentProjectId);
      formData.append('phase', selectedPhase);
      formData.append('zone', selectedZone);
      formData.append('tags', JSON.stringify(tags));

      await fetch('/api/photos', {
        method: 'POST',
        body: formData
      });

      await fetchPhotos();
      setCapturedPhoto(null);
      setTags([]);
      setView('home');
    }
  };

  const deletePhoto = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
      await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      await fetchPhotos();
    }
  };

  const filteredGallery = gallery.filter(photo => {
    const projectMatch = !filterProject || projects.find(p => p.id === photo.projectId)?.name.toLowerCase().includes(filterProject.toLowerCase());
    const phaseMatch = !filterPhase || photo.phase.toLowerCase().includes(filterPhase.toLowerCase());
    const zoneMatch = !filterZone || photo.zone.toLowerCase().includes(filterZone.toLowerCase());
    const tagMatch = !filterTag || photo.tags.some(t => t.toLowerCase().includes(filterTag.toLowerCase()));
    return projectMatch && phaseMatch && zoneMatch && tagMatch;
  });

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Hidden File Input for Camera */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

      <main className="flex-1 flex flex-col p-6 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-5xl font-display font-light tracking-tight text-neutral-800">
                  Snap<span className="font-semibold">Tec</span>
                </h1>
              </div>

              <button 
                onClick={handleCaptureClick}
                className="w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-all active:scale-95 border border-neutral-100"
              >
                <Camera size={48} strokeWidth={1.5} />
              </button>

              <div className="relative w-full max-w-xs">
                <button 
                  onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                  className="w-full py-4 px-6 bg-white rounded-2xl shadow-sm flex items-center justify-between text-neutral-700 font-medium border border-neutral-100"
                >
                  <span>{currentProject?.name || 'Cargando...'}</span>
                  <ChevronDown size={20} className={`transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isProjectMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden z-50"
                    >
                      {projects.map(project => (
                        <button 
                          key={project.id}
                          onClick={() => {
                            setCurrentProjectId(project.id);
                            setIsProjectMenuOpen(false);
                          }}
                          className={`w-full px-6 py-4 text-left hover:bg-neutral-50 transition-colors ${currentProjectId === project.id ? 'text-neutral-900 font-semibold bg-neutral-50' : 'text-neutral-500'}`}
                        >
                          {project.name}
                        </button>
                      ))}
                      <button 
                        onClick={addProject}
                        className="w-full px-6 py-4 text-left text-emerald-600 font-medium hover:bg-emerald-50 transition-colors flex items-center space-x-2"
                      >
                        <Plus size={18} />
                        <span>Nuevo Proyecto</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {view === 'capture' && capturedPhoto && (
            <motion.div 
              key="capture"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col space-y-6"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-neutral-200">
                <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                <button 
                  onClick={() => { setCapturedPhoto(null); setView('home'); }}
                  className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 px-1">Fases</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProject?.phases.map(phase => (
                      <button 
                        key={phase}
                        onClick={() => setSelectedPhase(phase)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${selectedPhase === phase ? 'bg-neutral-900 text-white shadow-lg' : 'bg-white text-neutral-500 border border-neutral-100'}`}
                      >
                        {phase}
                      </button>
                    ))}
                    <button 
                      onClick={() => addPhase(currentProjectId)}
                      className="p-2 rounded-xl bg-neutral-100 text-neutral-400 hover:bg-neutral-200 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 px-1">Zonas</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProject?.zones.map(zone => (
                      <button 
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-4 py-2 rounded-xl text-sm transition-all ${selectedZone === zone ? 'bg-neutral-900 text-white shadow-lg' : 'bg-white text-neutral-500 border border-neutral-100'}`}
                      >
                        {zone}
                      </button>
                    ))}
                    <button 
                      onClick={() => addZone(currentProjectId)}
                      className="p-2 rounded-xl bg-neutral-100 text-neutral-400 hover:bg-neutral-200 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 px-1">Etiquetas</h3>
                  <form onSubmit={addTag} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Añadir etiqueta..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="px-4 bg-neutral-900 text-white rounded-2xl hover:bg-neutral-800 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-lg text-xs flex items-center space-x-1">
                        <span>{tag}</span>
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={savePhoto}
                  className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-semibold shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                >
                  <Check size={20} />
                  <span>Guardar Foto</span>
                </button>
              </div>
            </motion.div>
          )}

          {view === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col space-y-6"
            >
              <h2 className="text-2xl font-display font-semibold text-neutral-800">Galería</h2>
              
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Proyecto..." 
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-100 rounded-xl text-xs focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Fase..." 
                  value={filterPhase}
                  onChange={(e) => setFilterPhase(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-100 rounded-xl text-xs focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Zona..." 
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-100 rounded-xl text-xs focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Etiqueta..." 
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-3 py-2 bg-white border border-neutral-100 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {filteredGallery.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 space-y-4">
                  <ImageIcon size={64} strokeWidth={1} />
                  <p className="text-sm font-medium">No hay fotos que coincidan</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {filteredGallery.map(photo => (
                    <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden shadow-sm bg-neutral-200">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePhoto(photo.id);
                            }}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/80 font-medium uppercase tracking-tighter">{photo.phase}</p>
                          <p className="text-[10px] text-white font-semibold truncate">{photo.zone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'manage' && (
            <motion.div 
              key="manage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-semibold text-neutral-800">Proyectos</h2>
                <button 
                  onClick={addProject}
                  className="p-2 bg-neutral-900 text-white rounded-full shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {projects.map(project => (
                  <div key={project.id} className="bg-white p-5 rounded-3xl shadow-sm border border-neutral-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-neutral-800">{project.name}</h3>
                      <button onClick={() => deleteProject(project.id)} className="text-red-400 hover:text-red-600">
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
                        <span>Fases</span>
                        <button onClick={() => addPhase(project.id)} className="text-neutral-900"><Plus size={14} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.phases.map(p => (
                          <span key={p} className="px-3 py-1 bg-neutral-50 text-neutral-600 rounded-lg text-[10px] border border-neutral-100">{p}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
                        <span>Zonas</span>
                        <button onClick={() => addZone(project.id)} className="text-neutral-900"><Plus size={14} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.zones.map(z => (
                          <span key={z} className="px-3 py-1 bg-neutral-50 text-neutral-600 rounded-lg text-[10px] border border-neutral-100">{z}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center space-y-8 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-300">
                <User size={48} strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-neutral-800">Registro de Usuario</h2>
                <p className="text-sm text-neutral-500 max-w-[200px]">Regístrate para sincronizar tus proyectos en la nube.</p>
              </div>
              <button className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-medium hover:bg-neutral-800 transition-colors">
                Crear Cuenta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-neutral-100 flex items-center justify-around px-8">
        <button 
          onClick={() => setView('home')}
          className={`p-2 transition-colors ${view === 'home' ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-400'}`}
        >
          <Home size={24} />
        </button>
        <button 
          onClick={() => setView('manage')}
          className={`p-4 -mt-12 bg-neutral-900 text-white rounded-full shadow-xl transition-transform active:scale-90 ${view === 'manage' ? 'scale-110' : 'scale-100'}`}
        >
          <Plus size={24} />
        </button>
        <button 
          onClick={() => setView('gallery')}
          className={`p-2 transition-colors ${view === 'gallery' ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-400'}`}
        >
          <ImageIcon size={24} />
        </button>
      </nav>
    </div>
  );
}
