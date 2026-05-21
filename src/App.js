// ⚡ GELİŞTİRİLMİŞ ULTIMATE VERSİYON - TAM FONKSİYONEL
import React, { useState, useEffect } from "react";
import { Search, Bookmark, CheckCircle, Film, Tv, X, Users, Play, Clock, Calendar, Star, TrendingUp, Plus, Minus, Eye, EyeOff } from "lucide-react";

const API_KEY = "4b133907256021b477d7644ac223471a";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const POSTER_URL = "https://image.tmdb.org/t/p/w342";
const PROVIDER_URL = "https://image.tmdb.org/t/p/w200";

export default function App() {
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [myList, setMyList] = useState(() => JSON.parse(localStorage.getItem("myList")) || []);
  const [watchedList, setWatchedList] = useState(() => JSON.parse(localStorage.getItem("watchedList")) || []);
  
  // Ana sayfa verileri
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [trending, setTrending] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mediaType, setMediaType] = useState("all"); // all, movie, tv
  const [loading, setLoading] = useState({ home: false, search: false, details: false });
  const [error, setError] = useState(null);

  // 💾 Verileri Kaydet
  useEffect(() => {
    localStorage.setItem("myList", JSON.stringify(myList));
    localStorage.setItem("watchedList", JSON.stringify(watchedList));
  }, [myList, watchedList]);

  // 🏠 Ana sayfa verilerini çek
  useEffect(() => {
    if (view === "home") {
      fetchHomeData();
    }
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
    } catch (err) {
      setError("Veriler yüklenirken bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, home: false }));
    }
  };

  // 🔍 Arama
  useEffect(() => {
    if (searchTerm.trim().length > 2) {
      const delayDebounce = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(prev => ({ ...prev, search: true }));
    setError(null);
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
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  // 🎬 Detay ve Ek Bilgileri Çek
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
      console.error("Detay yüklenemedi:", err);
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  // Yardımcı fonksiyonlar
  const isInMyList = (id) => myList.some(item => item.id === id);
  const isWatched = (id) => watchedList.some(item => item.id === id);

  const addToMyList = (item) => {
    if (!isInMyList(item.id)) {
      setMyList(prev => [...prev, item]);
    } else {
      setMyList(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const markAsWatched = (item) => {
    if (!isWatched(item.id)) {
      setWatchedList(prev => [...prev, item]);
    } else {
      setWatchedList(prev => prev.filter(i => i.id !== item.id));
    }
  };

  // Grid Kart Bileşeni
  const MediaCard = ({ item, showActions = true }) => {
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;
    const year = date ? date.split("-")[0] : "";
    const media_type = item.media_type || (item.first_air_date ? "tv" : "movie");
    
    return (
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all duration-300">
        <div className="relative cursor-pointer" onClick={() => fetchDetails(item)}>
          <img 
            src={item.poster_path ? `${POSTER_URL}${item.poster_path}` : "https://via.placeholder.com/342x513?text=No+Poster"} 
            alt={title}
            className="w-full h-auto object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 text-xs flex items-center gap-1">
            {media_type === "movie" ? <Film size={12} /> : <Tv size={12} />}
            <span>{media_type === "movie" ? "Film" : "Dizi"}</span>
          </div>
          {item.vote_average > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/70 rounded-full px-2 py-1 text-xs flex items-center gap-1">
              <Star size={12} className="text-yellow-400" />
              <span>{item.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{title}</h3>
          <p className="text-gray-400 text-xs">{year}</p>
          
          {showActions && (
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => addToMyList(item)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  isInMyList(item.id) ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isInMyList(item.id) ? <Minus size={12} /> : <Plus size={12} />}
                {isInMyList(item.id) ? "Çıkar" : "Liste"}
              </button>
              <button 
                onClick={() => markAsWatched(item)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  isWatched(item.id) ? "bg-green-700 hover:bg-green-800" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isWatched(item.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                {isWatched(item.id) ? "İzlendi" : "İzle"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Detay Modalı
  const DetailModal = () => {
    if (!selected || !details) return null;
    
    const title = details.title || details.name;
    const trailer = details.videos?.find(v => v.type === "Trailer" && v.site === "YouTube");
    
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
        <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelected(null)} className="sticky top-4 right-4 float-right bg-gray-800 p-2 rounded-full hover:bg-gray-700 z-10">
            <X className="text-white" />
          </button>
          
          <div className="p-6 pt-0">
            <div className="md:flex gap-8">
              <img src={`${IMAGE_URL}${selected.poster_path}`} className="w-64 rounded-xl shadow-lg mx-auto md:mx-0" alt={title} />
              <div className="flex-1 mt-4 md:mt-0">
                <h2 className="text-3xl font-bold mb-2">{title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={16}/> {details.release_date || details.first_air_date || "Bilinmiyor"}</span>
                  <span className="flex items-center gap-1"><Clock size={16}/> {details.runtime || details.episode_run_time?.[0] || "?"} dk</span>
                  <span className="flex items-center gap-1"><Star size={16} className="text-yellow-400"/> {details.vote_average?.toFixed(1)}/10</span>
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">{details.overview || "Açıklama bulunmuyor."}</p>

                {details.providers?.flatrate?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">📺 İzleme Platformları:</p>
                    <div className="flex flex-wrap gap-2">
                      {details.providers.flatrate.slice(0, 5).map(p => (
                        <img key={p.provider_id} src={`${PROVIDER_URL}${p.logo_path}`} className="w-8 h-8 rounded-md bg-white p-0.5" alt={p.provider_name} title={p.provider_name}/>
                      ))}
                    </div>
                  </div>
                )}

                {trailer && (
                  <div className="mb-6">
                    <button 
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank")}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
                    >
                      <Play size={16} /> Fragmanı İzle
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => addToMyList(selected)}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                      isInMyList(selected.id) ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isInMyList(selected.id) ? <Minus size={18} /> : <Plus size={18} />}
                    {isInMyList(selected.id) ? 'Listeden Kaldır' : 'İzleme Listeme Ekle'}
                  </button>
                  <button 
                    onClick={() => markAsWatched(selected)}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ${
                      isWatched(selected.id) ? 'bg-green-700 hover:bg-green-800' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {isWatched(selected.id) ? <CheckCircle size={18} /> : <Eye size={18} />}
                    {isWatched(selected.id) ? 'İzledim (Kaldır)' : 'İzledim'}
                  </button>
                </div>
              </div>
            </div>

            {/* Oyuncu Kadrosu */}
            {details.credits?.cast?.length > 0 && (
              <>
                <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2"><Users size={20}/> Oyuncu Kadrosu</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {details.credits.cast.slice(0, 10).map(actor => (
                    <div key={actor.id} className="min-w-[100px] text-center">
                      <img 
                        src={actor.profile_path ? `${IMAGE_URL}${actor.profile_path}` : 'https://via.placeholder.com/100x100?text=No+Image'} 
                        className="w-20 h-20 rounded-full mx-auto object-cover" 
                        alt={actor.name}
                      />
                      <p className="text-xs mt-2 font-medium truncate">{actor.name}</p>
                      <p className="text-xs text-gray-400 truncate">{actor.character}</p>
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
    if (loading.home) return <div className="text-center py-20">Yükleniyor...</div>;
    if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
    
    return (
      <>
        {/* Trend Bölümü */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-red-500" />
            <h2 className="text-2xl font-bold">Bu Hafta Trend Olanlar</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {trending.slice(0, 12).map(item => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Popüler Filmler */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Film className="text-red-500" />
            <h2 className="text-2xl font-bold">Popüler Filmler</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {popularMovies.slice(0, 12).map(movie => (
              <MediaCard key={movie.id} item={{ ...movie, media_type: "movie" }} />
            ))}
          </div>
        </div>

        {/* Popüler Diziler */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tv className="text-red-500" />
            <h2 className="text-2xl font-bold">Popüler Diziler</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {popularTV.slice(0, 12).map(show => (
              <MediaCard key={show.id} item={{ ...show, media_type: "tv" }} />
            ))}
          </div>
        </div>
      </>
    );
  };

  // Liste görünümü (MyList ve Watched için ortak)
  const renderList = (items, title, emptyMessage) => (
    <div>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">{emptyMessage}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map(item => (
            <MediaCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  // Arama çubuğu (sadece ana sayfada göster)
  const SearchBar = () => (
    <div className="mb-8">
      <div className="relative max-w-md mx-auto">
        <input
          type="text"
          placeholder="Film, dizi, oyuncu ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>
      
      {/* Medya tipi filtresi */}
      <div className="flex justify-center gap-2 mt-3">
        {["all", "movie", "tv"].map(type => (
          <button
            key={type}
            onClick={() => setMediaType(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              mediaType === type ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {type === "all" ? "Tümü" : type === "movie" ? "Filmler" : "Diziler"}
          </button>
        ))}
      </div>

      {/* Arama sonuçları */}
      {searchTerm.length > 2 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">
            "{searchTerm}" için sonuçlar ({loading.search ? "aranıyor..." : searchResults.length})
          </h3>
          {loading.search ? (
            <div className="text-center py-10">Aranıyor...</div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Sonuç bulunamadı.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map(item => (
                <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header ve Navigasyon */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-4 border-b border-gray-800">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
            CineList
          </h1>
          
          <nav className="flex gap-2">
            {[
              { id: "home", label: "Ana Sayfa", icon: <Film size={18} /> },
              { id: "myList", label: "Listem", icon: <Bookmark size={18} /> },
              { id: "watched", label: "İzlediklerim", icon: <CheckCircle size={18} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setView(tab.id);
                  setSearchTerm(""); // sayfa değişince arama temizle
                  setSearchResults([]);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  view === tab.id ? "bg-red-600 shadow-lg shadow-red-600/30" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Ana İçerik */}
        <main>
          {view === "home" && (
            <>
              <SearchBar />
              {searchTerm.length <= 2 && renderHomeContent()}
            </>
          )}
          
          {view === "myList" && renderList(myList, "📋 İzleme Listem", "Listeniz henüz boş. Film veya dizileri listeye ekleyin.")}
          
          {view === "watched" && renderList(watchedList, "✅ İzlediklerim", "Henüz izlediğiniz bir şey yok. İzlediklerinizi işaretleyin.")}
        </main>
      </div>

      {/* Detay Modalı */}
      {loading.details && selected && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-xl">Detaylar yükleniyor...</div>
        </div>
      )}
      {selected && details && <DetailModal />}
    </div>
  );
}
