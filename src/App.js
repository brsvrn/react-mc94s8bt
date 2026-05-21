// ⚡ ULTIMATE UI GELİŞTİRİLMİŞ VERSİYON - MODERN SİNEMA DENEYİMİ
import React, { useState, useEffect } from "react";
import { Search, Bookmark, CheckCircle, Film, Tv, X, Users, Play, Clock, Calendar, Star, TrendingUp, Plus, Minus, Eye, EyeOff, Sparkles, Flame } from "lucide-react";

const API_KEY = "4b133907256021b477d7644ac223471a";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/original";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";
const PROVIDER_URL = "https://image.tmdb.org/t/p/w200";

export default function App() {
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [myList, setMyList] = useState(() => JSON.parse(localStorage.getItem("myList")) || []);
  const [watchedList, setWatchedList] = useState(() => JSON.parse(localStorage.getItem("watchedList")) || []);
  
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [trending, setTrending] = useState([]);
  const [spotlight, setSpotlight] = useState(null); // Hero banner için
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mediaType, setMediaType] = useState("all");
  const [loading, setLoading] = useState({ home: false, search: false, details: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem("myList", JSON.stringify(myList));
    localStorage.setItem("watchedList", JSON.stringify(watchedList));
  }, [myList, watchedList]);

  useEffect(() => {
    if (view === "home") fetchHomeData();
  }, [view]);

  const fetchHomeData = async () => {
    setLoading(prev => ({ ...prev, home: true }));
    setError(null);
    try {
      const [movies, tv, trend] = await Promise.all([
        fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=tr-TR&page=1`).then(r => r.json()),
        fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=tr-TR&page=1`).then(r => r.json()),
        fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=tr-TR`).then(r => r.json())
      ]);
      setPopularMovies(movies.results || []);
      setPopularTV(tv.results || []);
      setTrending(trend.results || []);
      // İlk trending öğeyi spotlight yap
      if (trend.results && trend.results.length > 0) setSpotlight(trend.results[0]);
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, home: false }));
    }
  };

  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      const delay = setTimeout(() => performSearch(), 500);
      return () => clearTimeout(delay);
    } else setSearchResults([]);
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(prev => ({ ...prev, search: true }));
    try {
      let results = [];
      if (mediaType === "all") {
        const [movies, tv] = await Promise.all([
          fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(searchTerm)}`).then(r => r.json()),
          fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(searchTerm)}`).then(r => r.json())
        ]);
        results = [...(movies.results || []).map(m => ({ ...m, media_type: "movie" })),
                   ...(tv.results || []).map(t => ({ ...t, media_type: "tv" }))];
      } else {
        const endpoint = mediaType === "movie" ? "search/movie" : "search/tv";
        const data = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(searchTerm)}`).then(r => r.json());
        results = (data.results || []).map(item => ({ ...item, media_type: mediaType }));
      }
      setSearchResults(results);
    } catch (err) {
      setError("Arama yapılamadı.");
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const fetchDetails = async (item) => {
    setSelected(item);
    setLoading(prev => ({ ...prev, details: true }));
    try {
      const type = item.media_type || (item.first_air_date ? "tv" : "movie");
      const [d, c, p, v] = await Promise.all([
        fetch(`${BASE_URL}/${type}/${item.id}?api_key=${API_KEY}&language=tr-TR`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${item.id}/credits?api_key=${API_KEY}&language=tr-TR`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${item.id}/watch/providers?api_key=${API_KEY}`).then(r => r.json()),
        fetch(`${BASE_URL}/${type}/${item.id}/videos?api_key=${API_KEY}&language=tr-TR`).then(r => r.json())
      ]);
      setDetails({ ...d, credits: c, providers: p.results?.TR || {}, type, videos: v.results || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const isInMyList = (id) => myList.some(item => item.id === id);
  const isWatched = (id) => watchedList.some(item => item.id === id);

  const addToMyList = (item) => {
    if (!isInMyList(item.id)) setMyList(prev => [...prev, item]);
    else setMyList(prev => prev.filter(i => i.id !== item.id));
  };

  const markAsWatched = (item) => {
    if (!isWatched(item.id)) setWatchedList(prev => [...prev, item]);
    else setWatchedList(prev => prev.filter(i => i.id !== item.id));
  };

  // 🌟 YENİ: Modern Kart Bileşeni (glow + hover efekti)
  const MediaCard = ({ item, showActions = true }) => {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const year = date ? date.split("-")[0] : "";
    const media_type = item.media_type || (item.first_air_date ? "tv" : "movie");
    const rating = item.vote_average?.toFixed(1);
    
    return (
      <div className="group relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer">
        <div onClick={() => fetchDetails(item)} className="relative overflow-hidden">
          <img 
            src={item.poster_path ? `${POSTER_URL}${item.poster_path}` : "https://via.placeholder.com/342x513?text=No+Poster"} 
            alt={title}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Badge'ler */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1 shadow-lg">
              {media_type === "movie" ? <Film size={12} /> : <Tv size={12} />}
              {media_type === "movie" ? "FİLM" : "DİZİ"}
            </span>
            {rating > 0 && (
              <span className="bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1">
                <Star size={12} className="text-yellow-400" />
                {rating}
              </span>
            )}
          </div>
          
          {/* Yıl badge'i */}
          {year && (
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-mono">
              {year}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-base truncate group-hover:text-red-400 transition-colors">{title}</h3>
          
          {showActions && (
            <div className="flex gap-2 mt-3">
              <button 
                onClick={(e) => { e.stopPropagation(); addToMyList(item); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isInMyList(item.id) ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isInMyList(item.id) ? <Minus size={14} /> : <Plus size={14} />}
                {isInMyList(item.id) ? "ÇIKAR" : "LİSTE"}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); markAsWatched(item); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isWatched(item.id) ? "bg-green-700 hover:bg-green-800 shadow-lg shadow-green-600/30" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isWatched(item.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                {isWatched(item.id) ? "İZLENDİ" : "İZLE"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 🎬 HERO SPOTLIGHT (Görseldeki gibi büyük banner)
  const HeroSpotlight = () => {
    if (!spotlight) return null;
    const title = spotlight.title || spotlight.name;
    const backdrop = spotlight.backdrop_path || spotlight.poster_path;
    return (
      <div className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10"></div>
        <img 
          src={backdrop ? `${BACKDROP_URL}${backdrop}` : "https://via.placeholder.com/1920x600"} 
          alt={title}
          className="w-full h-96 object-cover"
        />
        <div className="absolute bottom-0 left-0 z-20 p-8 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="text-red-500 fill-red-500" size={24} />
            <span className="text-red-500 font-bold tracking-wider">TREND • BU HAFTA</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-red-300 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-200 mb-6 line-clamp-2">{spotlight.overview}</p>
          <button 
            onClick={() => fetchDetails(spotlight)}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
          >
            <Play size={20} /> ŞİMDİ İZLE
          </button>
        </div>
      </div>
    );
  };

  // Detay Modalı (Gelişmiş UI)
  const DetailModal = () => {
    if (!selected || !details) return null;
    const title = details.title || details.name;
    const trailer = details.videos?.find(v => v.type === "Trailer" && v.site === "YouTube");
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
        <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-700" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelected(null)} className="sticky top-4 right-4 float-right bg-gray-800 p-2 rounded-full hover:bg-gray-700 z-10 transition">
            <X />
          </button>
          <div className="p-6 pt-0">
            <div className="md:flex gap-8">
              <img src={`${IMAGE_URL}${selected.poster_path}`} className="w-64 rounded-xl shadow-xl mx-auto md:mx-0" alt={title} />
              <div className="flex-1 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-red-300 bg-clip-text text-transparent">{title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={16}/> {details.release_date || details.first_air_date || "?"}</span>
                  <span className="flex items-center gap-1"><Clock size={16}/> {details.runtime || details.episode_run_time?.[0] || "?"} dk</span>
                  <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400"/> {details.vote_average?.toFixed(1)}/10</span>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">{details.overview || "Açıklama yok."}</p>
                {details.providers?.flatrate?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">📺 Platformlar:</p>
                    <div className="flex flex-wrap gap-2">
                      {details.providers.flatrate.slice(0,5).map(p => (
                        <img key={p.provider_id} src={`${PROVIDER_URL}${p.logo_path}`} className="w-8 h-8 rounded-md bg-white p-0.5" alt={p.provider_name} />
                      ))}
                    </div>
                  </div>
                )}
                {trailer && (
                  <button onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`)} className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg flex items-center gap-2 font-bold mb-4 transition">
                    <Play size={16} /> FRAGMAN İZLE
                  </button>
                )}
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => addToMyList(selected)} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition ${isInMyList(selected.id) ? 'bg-red-600' : 'bg-blue-600'}`}>
                    {isInMyList(selected.id) ? <Minus size={18} /> : <Plus size={18} />}
                    {isInMyList(selected.id) ? 'LISTEDEN ÇIKAR' : 'LISTEYE EKLE'}
                  </button>
                  <button onClick={() => markAsWatched(selected)} className={`px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition ${isWatched(selected.id) ? 'bg-green-700' : 'bg-emerald-600'}`}>
                    {isWatched(selected.id) ? <CheckCircle size={18} /> : <Eye size={18} />}
                    {isWatched(selected.id) ? 'İZLENDİ' : 'İZLEDİM'}
                  </button>
                </div>
              </div>
            </div>
            {details.credits?.cast?.length > 0 && (
              <>
                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2"><Users size={20}/> Oyuncular</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {details.credits.cast.slice(0,10).map(a => (
                    <div key={a.id} className="min-w-[100px] text-center">
                      <img src={a.profile_path ? `${IMAGE_URL}${a.profile_path}` : 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-full mx-auto object-cover" />
                      <p className="text-xs mt-2 font-medium truncate">{a.name}</p>
                      <p className="text-xs text-gray-400 truncate">{a.character}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Ana sayfa içeriği
  const renderHomeContent = () => {
    if (loading.home) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-red-500"></div></div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    return (
      <>
        <HeroSpotlight />
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="text-red-500" size={28} />
            <h2 className="text-2xl font-black">🔥 Trend Olanlar</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {trending.slice(0,12).map(item => <MediaCard key={item.id} item={item} />)}
          </div>
        </div>
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Film className="text-red-500" size={28} />
            <h2 className="text-2xl font-black">🎬 Popüler Filmler</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {popularMovies.slice(0,12).map(m => <MediaCard key={m.id} item={{...m, media_type:"movie"}} />)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Tv className="text-red-500" size={28} />
            <h2 className="text-2xl font-black">📺 Popüler Diziler</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {popularTV.slice(0,12).map(s => <MediaCard key={s.id} item={{...s, media_type:"tv"}} />)}
          </div>
        </div>
      </>
    );
  };

  const renderList = (items, title, emptyMessage) => (
    <div>
      <h2 className="text-3xl font-black mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{title}</h2>
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-700 rounded-2xl">{emptyMessage}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {items.map(item => <MediaCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-black text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-red-500" size={32} />
            <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent tracking-tight">CineList</h1>
          </div>
          <nav className="flex gap-3">
            {[
              { id: "home", label: "ANA SAYFA", icon: <Film size={18} /> },
              { id: "myList", label: "LİSTEM", icon: <Bookmark size={18} /> },
              { id: "watched", label: "İZLENENLER", icon: <CheckCircle size={18} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id); setSearchTerm(""); setSearchResults([]); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold transition-all duration-300 ${
                  view === tab.id ? "bg-red-600 shadow-lg shadow-red-600/40 scale-105" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {view === "home" && (
            <>
              <div className="mb-8">
                <div className="relative max-w-md mx-auto">
                  <input type="text" placeholder="Film, dizi, oyuncu ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-800 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition" />
                  <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {["all","movie","tv"].map(type => (
                    <button key={type} onClick={() => setMediaType(type)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${mediaType === type ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}>
                      {type === "all" ? "TÜMÜ" : type === "movie" ? "FİLMLER" : "DİZİLER"}
                    </button>
                  ))}
                </div>
                {searchTerm.length > 2 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4">🔍 "{searchTerm}" için sonuçlar ({loading.search ? "aranıyor..." : searchResults.length})</h3>
                    {loading.search ? <div className="text-center py-10">Aranıyor...</div> : searchResults.length === 0 ? <div className="text-center py-10 text-gray-400">Sonuç bulunamadı.</div> : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {searchResults.map(item => <MediaCard key={`${item.media_type}-${item.id}`} item={item} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {searchTerm.length <= 2 && renderHomeContent()}
            </>
          )}
          {view === "myList" && renderList(myList, "📋 İZLEME LİSTEM", "Listen boş. Hemen bir film veya dizi ekle!")}
          {view === "watched" && renderList(watchedList, "✅ İZLEDİKLERİM", "Henüz izlediğin bir şey yok. İzlediklerini işaretle!")}
        </main>
      </div>
      {loading.details && selected && <div className="fixed inset-0 bg-black/90 flex items-center justify-center"><div className="bg-gray-800 p-6 rounded-xl">Detaylar yükleniyor...</div></div>}
      {selected && details && <DetailModal />}
    </div>
  );
}
