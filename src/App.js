// ⚡ ULTIMATE VERSION (kısaltılmış ama güçlü yapı)

import React, { useState, useEffect } from "react";
import { Search, Bookmark, CheckCircle, Film, Tv, X } from "lucide-react";

const API_KEY = "4b133907256021b477d7644ac223471a";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

export default function App() {
  const [view, setView] = useState("home");
  const [categories, setCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [myList, setMyList] = useState(
    JSON.parse(localStorage.getItem("myList")) || []
  );

  // 💾 myList'i localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem("myList", JSON.stringify(myList));
  }, [myList]);

  // 🎬 kategori verileri yükle
  useEffect(() => {
    const fetchData = async () => {
      const endpoints = {
        trending: "/trending/all/week",
        popular: "/movie/popular",
        top: "/movie/top_rated",
        tv: "/tv/popular"
      };

      let data = {};
      for (let key in endpoints) {
        const res = await fetch(
          `${BASE_URL}${endpoints[key]}?api_key=${API_KEY}&language=tr-TR`
        );
        const json = await res.json();
        data[key] = json.results;
      }

      setCategories(data);
    };

    fetchData();
  }, []);

  // 🔍 search debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm) {
        fetch(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${searchTerm}&language=tr-TR`
        )
          .then((res) => res.json())
          .then((json) => setResults(json.results));
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [searchTerm]);

  // 📌 MyList'e ekle/çıkar
  const toggleMyList = (item) => {
    const exists = myList.some((x) => x.id === item.id);
    if (exists) {
      setMyList(myList.filter((x) => x.id !== item.id));
    } else {
      setMyList([...myList, item]);
    }
  };

  // 🏠 Home View
  const HomeView = () => (
    <div className="space-y-8">
      {Object.entries(categories).map(([key, items]) => (
        <div key={key}>
          <h2 className="text-2xl font-bold mb-4 capitalize">{key}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {items?.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden"
                onClick={() => setSelected(item)}
              >
                <img
                  src={`${IMAGE_URL}${item.poster_path}`}
                  alt={item.title || item.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition"
                />
                <div className="absolute top-2 right-2 bg-black/70 p-2 rounded hidden group-hover:block">
                  <Bookmark
                    size={20}
                    className={myList.some((x) => x.id === item.id) ? "fill-yellow-400 text-yellow-400" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMyList(item);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // 🎀 MyList View
  const MyListView = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Benim Listem</h2>
      {myList.length === 0 ? (
        <p className="text-gray-400">Liste boş. Film veya dizi ekleyin!</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {myList.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden"
              onClick={() => setSelected(item)}
            >
              <img
                src={`${IMAGE_URL}${item.poster_path}`}
                alt={item.title || item.name}
                className="w-full h-64 object-cover group-hover:scale-110 transition"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMyList(item);
                }}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded"
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 🔎 Search View
  const SearchView = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Arama Sonuçları</h2>
      {results.length === 0 && searchTerm ? (
        <p className="text-gray-400">Sonuç bulunamadı</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {results.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden"
              onClick={() => setSelected(item)}
            >
              <img
                src={item.poster_path ? `${IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/200x300?text=No+Image"}
                alt={item.title || item.name}
                className="w-full h-64 object-cover group-hover:scale-110 transition"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <Film size={32} className="text-red-600" />
          <h1 className="text-3xl font-bold">🎬 Netflix Clone</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView("home")}
            className={`px-4 py-2 rounded transition ${
              view === "home" ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setView("myList")}
            className={`px-4 py-2 rounded flex items-center gap-2 transition ${
              view === "myList" ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"
            }`}
          >
            <Bookmark size={18} /> Listem
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative">
        <div className="flex items-center bg-gray-800 rounded-lg p-3">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Film veya dizi ara..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value) setView("search");
            }}
            className="bg-transparent flex-1 ml-3 outline-none"
          />
          {searchTerm && (
            <X
              size={20}
              className="cursor-pointer text-gray-400 hover:text-white"
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {view === "home" && <HomeView />}
        {view === "myList" && <MyListView />}
        {view === "search" && <SearchView />}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 p-2 rounded"
            >
              <X size={24} />
            </button>
            <img
              src={`${IMAGE_URL}${selected.poster_path}`}
              alt={selected.title || selected.name}
              className="w-full h-96 object-cover rounded-lg mb-4"
            />
            <h3 className="text-2xl font-bold mb-2">{selected.title || selected.name}</h3>
            <p className="text-gray-300 mb-4">{selected.overview}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-400" />
                <span>{(selected.vote_average || 0).toFixed(1)}/10</span>
              </div>
              <button
                onClick={() => toggleMyList(selected)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center gap-2"
              >
                <Bookmark size={18} />
                {myList.some((x) => x.id === selected.id) ? "Listeden Çıkar" : "Listeye Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
