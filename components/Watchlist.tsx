'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Star, Plus } from 'lucide-react';
import { getTopCryptos } from '@/lib/api';
import type { CryptoData } from '@/lib/api';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = localStorage.getItem('watchlist');
    if (saved) {
      setWatchlist(JSON.parse(saved));
    }
    loadCryptos();
  }, []);

  const loadCryptos = async () => {
    const data = await getTopCryptos(10);
    setCryptos(data);
  };

  const toggleWatchlist = (id: string) => {
    const newWatchlist = watchlist.includes(id)
      ? watchlist.filter((w) => w !== id)
      : [...watchlist, id];
    setWatchlist(newWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
  };

  const watchlistItems = cryptos.filter((c) => watchlist.includes(c.id));

  return (
    <div className="glass-effect rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <Star className="w-5 h-5 text-gray-400" />
        Watchlist
      </h3>

      {watchlistItems.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No items in watchlist</p>
          <p className="text-sm mt-2">
            Click the star icon on any crypto to add it
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlistItems.map((crypto) => (
            <div
              key={crypto.id}
              className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-white/[0.03] transition-colors border border-white/[0.05]"
            >
              <div className="flex items-center gap-3">
                {crypto.image && (
                  <Image
                    src={crypto.image}
                    alt={crypto.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold text-sm text-white">{crypto.name}</p>
                  <p className="text-xs text-gray-400">
                    ${crypto.current_price.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleWatchlist(crypto.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/[0.1]">
        <p className="text-xs text-gray-400 mb-2">Quick Add:</p>
        <div className="flex flex-wrap gap-2">
          {cryptos
            .filter((c) => !watchlist.includes(c.id))
            .slice(0, 5)
            .map((crypto) => (
              <button
                key={crypto.id}
                onClick={() => toggleWatchlist(crypto.id)}
                className="flex items-center gap-1 px-3 py-1 bg-white/[0.05] hover:bg-white/[0.1] rounded-full text-xs transition-colors text-gray-300 border border-white/[0.1]"
              >
                <Plus className="w-3 h-3" />
                {crypto.symbol.toUpperCase()}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

