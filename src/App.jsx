import React, { useState, useEffect, useRef } from 'react'
import './index.css'

// --- Mock Data ---
const DEFAULT_PROPERTIES = [
  { id: 1, title: '강남구 역삼동 프리미엄 오피스텔', price: '월세 1000/120', type: '오피스텔', area: '32㎡', lat: 37.4980, lng: 127.0276, status: 'active', desc: '강남역 도보 5분 거리, 풀옵션 신축급.' },
  { id: 2, title: '서초구 반포동 아파트 매매', price: '매매 32억', type: '아파트', area: '84㎡', lat: 37.5012, lng: 127.0012, status: 'active', desc: '한강 조망 가능, 리모델링 완료.' },
  { id: 3, title: '송파항 잠실동 빌라 전세', price: '전세 4.5억', type: '빌라', area: '58㎡', lat: 37.5133, lng: 127.1001, status: 'pending', desc: '대출 가능, 조용한 주택가.' },
];

// --- Icons (Inline SVGs for reliability) ---
const Icons = {
  MapPin: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  GPS: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v3m0 14v3m10-10h-3M5 12H2m13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
};

function App() {
  const [properties, setProperties] = useState(() => {
    const saved = localStorage.getItem('properties');
    return saved ? JSON.parse(saved) : DEFAULT_PROPERTIES;
  });
  const [filteredProps, setFilteredProps] = useState(properties);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBroker, setIsBroker] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userPos, setUserPos] = useState(null);

  const mapRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.4980, 127.0276), // Gangnam Stn
      level: 4
    };

    const kakaoMap = new window.kakao.maps.Map(container, options);
    setMap(kakaoMap);

    // Watch GPS
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
      });
    }
  }, []);

  // Update Markers
  useEffect(() => {
    if (!map) return;

    // Clear old markers
    markers.forEach(m => m.setMap(null));
    const newMarkers = [];

    properties.forEach(prop => {
      const position = new window.kakao.maps.LatLng(prop.lat, prop.lng);
      
      const content = `
        <div class="custom-overlay" onclick="window.dispatchSelect(${prop.id})">
          ${prop.price.split(' ')[1] || prop.price}
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      });

      overlay.setMap(map);
      newMarkers.push(overlay);
    });

    setMarkers(newMarkers);

    // Global selector for overlays
    window.dispatchSelect = (id) => {
      const p = properties.find(x => x.id === id);
      setSelectedProperty(p);
      map.panTo(new window.kakao.maps.LatLng(p.lat, p.lng));
    };

  }, [properties, map]);

  // Filtering
  useEffect(() => {
    const filtered = properties.filter(p => 
      p.title.includes(searchTerm) || p.type.includes(searchTerm) || p.price.includes(searchTerm)
    );
    setFilteredProps(filtered);
  }, [searchTerm, properties]);

  const handleAddProperty = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProp = {
      id: Date.now(),
      title: formData.get('title'),
      price: formData.get('price'),
      type: formData.get('type'),
      area: formData.get('area'),
      lat: map.getCenter().getLat(), // Add at current map center
      lng: map.getCenter().getLng(),
      status: 'active',
      desc: formData.get('desc')
    };

    const updated = [...properties, newProp];
    setProperties(updated);
    localStorage.setItem('properties', JSON.stringify(updated));
    setShowAddModal(false);
  };

  const moveToGPS = () => {
    if (userPos && map) {
      map.panTo(new window.kakao.maps.LatLng(userPos.lat, userPos.lng));
    } else {
      alert('GPS 정보를 불러오는 중입니다...');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('공유 링크가 클립보드에 복사되었습니다. (고객용 모드)');
    });
  };

  return (
    <div className="app-container">
      {/* Sidebar - Real Estate List */}
      <aside className="sidebar">
        <header className="search-box">
          <div className="logo" style={{ marginBottom: '20px' }}>
            <Icons.MapPin />
            <span>매물지도 Pro</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="지역, 건물명, 매물종류 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}>
              <Icons.Search />
            </div>
          </div>
        </header>

        <div className="property-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>검색 결과 {filteredProps.length}</span>
            {isBroker && (
              <button className="btn btn-primary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowAddModal(true)}>
                <Icons.Plus /> 등록
              </button>
            )}
          </div>

          {filteredProps.map(prop => (
            <div 
              key={prop.id} 
              className={`property-card ${selectedProperty?.id === prop.id ? 'active' : ''}`}
              onClick={() => window.dispatchSelect(prop.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={`status-badge status-${prop.status}`}>
                  {prop.status === 'active' ? '진행중' : '보류'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prop.type}</span>
              </div>
              <h3>{prop.title}</h3>
              <p className="price">{prop.price}</p>
              <div className="info">
                <span>면적 {prop.area}</span>
                <span>•</span>
                <span>층수 정보없음</span>
              </div>
            </div>
          ))}
        </div>

        {isBroker && (
          <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Broker Subscription Active</p>
            <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
              <div style={{ width: '75%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Map Area */}
      <main className="map-container">
        {/* Top Control Bar */}
        <div className="top-bar">
          <div className="mode-toggle">
            <div 
              className={`toggle-item ${isBroker ? 'active' : ''}`}
              onClick={() => setIsBroker(true)}
            >
              중개인용
            </div>
            <div 
              className={`toggle-item ${!isBroker ? 'active' : ''}`}
              onClick={() => setIsBroker(false)}
            >
              고객용
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" style={{ background: 'white', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleShare}>
              <Icons.Share /> 공유하기
            </button>
            {isBroker && (
              <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                김
              </div>
            )}
          </div>
        </div>

        {/* The Map */}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>

        {/* Floating Controls */}
        <div className="float-btns">
          <button className="float-btn" onClick={moveToGPS} title="현재 위치">
            <Icons.GPS />
          </button>
          <button className="float-btn" onClick={() => map?.setLevel(map.getLevel() - 1)}>+</button>
          <button className="float-btn" onClick={() => map?.setLevel(map.getLevel() + 1)}>-</button>
        </div>

        {/* Selected Property Detail Bottom Sheet (Mobile-like) */}
        {selectedProperty && (
          <div style={{
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            width: '90%', maxWidth: '400px', background: 'white', borderRadius: '20px',
            padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', zIndex: '30'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{selectedProperty.price}</h2>
               <button onClick={() => setSelectedProperty(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>{selectedProperty.title}</p>
            <div style={{ margin: '16px 0', padding: '12px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.9rem' }}>
              {selectedProperty.desc}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>실시간 상담하기</button>
              <button className="btn" style={{ background: '#f1f5f9' }}>상세정보</button>
            </div>
          </div>
        )}
      </main>

      {/* Add Membership / Subscription Mockup */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginBottom: '20px' }}>새 매물 등록</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>현재 지도 중심 위치에 매물이 등록됩니다.</p>
            <form onSubmit={handleAddProperty}>
              <div className="form-group">
                <label>매물 제목</label>
                <input name="title" className="form-input" placeholder="강남역 인근 고급 빌라" required />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>금액 (전세/월세/매매)</label>
                  <input name="price" className="form-input" placeholder="전세 3억" required />
                </div>
                <div>
                  <label>매물 종류</label>
                  <select name="type" className="form-input">
                    <option>아파트</option>
                    <option>빌라</option>
                    <option>오피스텔</option>
                    <option>상가</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>면적 (㎡)</label>
                <input name="area" className="form-input" placeholder="59" />
              </div>
              <div className="form-group">
                <label>매물 설명</label>
                <textarea name="desc" className="form-input" rows="3" placeholder="특장점을 입력하세요..." style={{ resize: 'none' }}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn" style={{ flex: 1, background: '#f1f5f9' }} onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Overlay for Mockup (Broker mode only) */}
      {isBroker && properties.length > 10 && (
         <div className="modal-overlay">
            <div className="modal" style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💎</div>
               <h2>구독 서비스 안내</h2>
               <p style={{ margin: '10px 0 20px', color: 'var(--text-muted)' }}>더 많은 매물을 등록하고 고객 통계를 확인하려면 프리미엄 구독이 필요합니다.</p>
               <button className="btn btn-primary" style={{ width: '100%' }}>월 29,900원에 시작하기</button>
            </div>
         </div>
      )}
    </div>
  )
}

export default App
