// API İşlemleri

// Google Places API Anahtarı
const GOOGLE_API_KEY = 'AIzaSyDJ86Sq941naHo8LyVTq4CZKV-C38RpPGo';

// SendGrid API Anahtarı
const SENDGRID_API_KEY = 'your-sendgrid-api-key';

// API önbelleği için
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

// Map nesnesini oluştur
let map;

// Google Maps API yükleme durumunu takip eden global değişken
window.googleMapsLoaded = false;

// Google Maps'i başlat
function initMap() {
    try {
        // Eğer map zaten oluşturulmuşsa tekrar oluşturma
        if (map) {
            console.log('Map zaten oluşturulmuş');
            return;
        }
        
        // Google Maps API'si yüklü mü kontrol et
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error('Google Maps API henüz yüklenmemiş, initMap çağrılamaz');
            throw new Error('Google Maps API henüz yüklenmemiş');
        }
        
        // Görünmez bir div oluştur
        let mapDiv = document.getElementById('google-maps-container');
        
        // Eğer div yoksa oluştur
        if (!mapDiv) {
            mapDiv = document.createElement('div');
            mapDiv.id = 'google-maps-container';
            mapDiv.style.width = '100px';
            mapDiv.style.height = '100px';
            mapDiv.style.position = 'absolute';
            mapDiv.style.top = '-9999px';
            mapDiv.style.left = '-9999px';
            document.body.appendChild(mapDiv);
            console.log('Google Maps için container div oluşturuldu');
        }
        
        // Map nesnesini oluştur
        map = new google.maps.Map(mapDiv, {
            center: { lat: 41.0082, lng: 28.9784 }, // İstanbul koordinatları
            zoom: 8
        });
        
        // PlacesService'in çalıştığından emin olmak için test et
        try {
            const service = new google.maps.places.PlacesService(map);
            if (!service) {
                throw new Error('PlacesService oluşturulamadı');
            }
            console.log('PlacesService başarıyla oluşturuldu');
        } catch (error) {
            console.error('PlacesService oluşturma hatası:', error);
            throw new Error('PlacesService oluşturulamadı: ' + error.message);
        }
        
        console.log('Google Maps başarıyla başlatıldı');
    } catch (error) {
        console.error('Google Maps başlatma hatası:', error);
        throw new Error('Google Maps başlatılamadı: ' + error.message);
    }
}

// Sayfa yüklendiğinde map'i başlat
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Sayfa yüklendi, Google Maps API yükleniyor...');
        
        // API yükleme denemesi
        let retryCount = 0;
        const maxRetries = 5; // Maksimum deneme sayısını artırdık (3 -> 5)
        
        async function attemptLoadAPI() {
            try {
                await loadGoogleMapsAPI();
                initMap();
                console.log('Google Maps API başarıyla yüklendi ve başlatıldı');
            } catch (error) {
                retryCount++;
                console.error(`Google Maps API yükleme hatası (${retryCount}/${maxRetries}):`, error);
                
                if (retryCount < maxRetries) {
                    const retryDelay = 3000 * retryCount; // Bekleme süresini artırdık (2000 -> 3000)
                    console.log(`${retryDelay}ms sonra tekrar denenecek...`);
                    
                    // Her denemede bekleme süresini artır
                    setTimeout(attemptLoadAPI, retryDelay);
                } else {
                    console.error('Google Maps API yüklenemedi, maksimum deneme sayısına ulaşıldı');
                    
                    // Kullanıcıya bildirim göster
                    if (window.showNotification) {
                        window.showNotification('Google Maps API yüklenemedi. Lütfen sayfayı yenileyin veya internet bağlantınızı kontrol edin.', 'warning');
                    }
                    
                    // Kullanıcıya manuel yenileme seçeneği sun
                    const searchContainer = document.getElementById('search-results');
                    if (searchContainer) {
                        searchContainer.innerHTML = `
                            <div class="alert alert-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                <strong>Google Maps API yüklenemedi.</strong>
                                <p>Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.</p>
                                <button class="btn btn-primary mt-2" onclick="location.reload()">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Sayfayı Yenile
                                </button>
                            </div>
                        `;
                    }
                }
            }
        }
        
        // İlk denemeyi başlat
        attemptLoadAPI();
    } catch (error) {
        console.error('Google Maps başlatılamadı:', error);
    }
});

// İşletme detaylarını getir
async function getBusinessDetails(placeId) {
    try {
        // placeId kontrolü
        if (!placeId || typeof placeId !== 'string') {
            console.error('Geçersiz place_id formatı:', placeId);
            throw new Error('Geçersiz place_id: ' + placeId);
        }
        
        // Boşlukları temizle
        placeId = placeId.trim();
        
        if (placeId === '') {
            console.error('Boş place_id');
            throw new Error('Boş place_id');
        }
        
        // place_id formatını kontrol et - ChIJ... formatında olmalı
        if (!placeId.startsWith('ChIJ') && !placeId.startsWith('Eh')) {
            console.error('Geçersiz place_id formatı (ChIJ ile başlamıyor):', placeId);
            throw new Error('Geçersiz place_id formatı: ' + placeId);
        }
        
        console.log('getBusinessDetails çağrıldı, placeId:', placeId);
        
        // Önbellekte varsa ve süresi geçmediyse, önbellekten döndür
        const cachedData = apiCache.get(placeId);
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            console.log('İşletme detayları önbellekten alındı:', placeId);
            return cachedData.data;
        }
        
        // Map yüklü değilse yükle
        if (!map) {
            console.log('Map yüklü değil, yükleniyor...');
            try {
                await loadGoogleMapsAPI();
                initMap();
            } catch (error) {
                console.error('Google Maps API yüklenemedi:', error);
                throw new Error('Google Maps API yüklenemedi: ' + error.message);
            }
        }

        // Places Service için container div'i kontrol et
        let mapDiv = document.getElementById('google-maps-container');
        if (!mapDiv) {
            console.log('Google Maps container bulunamadı, yeniden oluşturuluyor');
            initMap();
            mapDiv = document.getElementById('google-maps-container');
        }
        
        // PlacesService oluştur
        const service = new google.maps.places.PlacesService(map);
        
        const request = {
            placeId: placeId,
            fields: [
                'name', 'rating', 'formatted_phone_number', 'international_phone_number', 
                'formatted_address', 'address_components', 'geometry', 'vicinity',
                'website', 'opening_hours', 'reviews', 'photos', 'types', 'url', 
                'user_ratings_total', 'business_status', 'price_level', 'plus_code'
            ],
            language: 'tr' // Türkçe sonuçlar için
        };

        console.log('Places API isteği gönderiliyor:', JSON.stringify(request));

        // API çağrısı için zaman aşımı ekle
        const result = await Promise.race([
            new Promise((resolve, reject) => {
                try {
                    service.getDetails(request, (place, status) => {
                        console.log('Places API yanıtı:', status);
                        
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            resolve(place);
                        } else {
                            console.error('Places API hata kodu:', status);
                            reject(new Error('İşletme detayları alınamadı: ' + status));
                        }
                    });
                } catch (error) {
                    console.error('Places API çağrısı başarısız:', error);
                    reject(new Error('Places API çağrısı başarısız: ' + error.message));
                }
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API isteği zaman aşımına uğradı')), 8000))
        ]);

        console.log('İşletme detayları alındı:', result.name);

        // Fotoğrafları optimize et
        if (result.photos && result.photos.length > 0) {
            try {
                result.photos = result.photos.slice(0, 5).map(photo => ({
                    url: photo.getUrl({ maxWidth: 800, maxHeight: 600 })
                }));
            } catch (error) {
                console.error('Fotoğraflar işlenirken hata:', error);
                result.photos = [];
            }
        } else {
            result.photos = [];
        }
        
        // E-posta adresini web sitesinden çıkarmaya çalış
        if (result.website) {
            try {
                result.email = extractEmailFromWebsite(result.website);
            } catch (error) {
                console.error('E-posta çıkarılırken hata:', error);
                result.email = '';
            }
        }
        
        // Telefon numarasını formatla
        if (result.formatted_phone_number) {
            try {
                result.formatted_phone_number_link = formatPhoneNumberForLink(result.formatted_phone_number);
                result.whatsapp_phone = formatPhoneForWhatsApp(result.formatted_phone_number);
            } catch (error) {
                console.error('Telefon numarası formatlanırken hata:', error);
            }
        }
        
        // Adres bileşenlerini ayrıştır
        if (result.address_components) {
            try {
                result.parsed_address = parseAddressComponents(result.address_components);
            } catch (error) {
                console.error('Adres bileşenleri ayrıştırılırken hata:', error);
            }
        }

        // Sonucu önbelleğe ekle
        apiCache.set(placeId, {
            data: result,
            timestamp: Date.now()
        });
        
        return result;
    } catch (error) {
        console.error('İşletme detayları alınırken hata oluştu:', error);
        
        // Önbellekte eski veri varsa, hataya rağmen onu döndür
        const cachedData = apiCache.get(placeId);
        if (cachedData) {
            console.log('Hata oluştu, önbellekteki eski veri kullanılıyor:', placeId);
            return cachedData.data;
        }
        
        throw error;
    }
}

// Web sitesinden e-posta adresini çıkar
function extractEmailFromWebsite(website) {
    // Basit bir e-posta çıkarma yöntemi
    // Gerçek uygulamada web sitesini tarayıp e-posta adreslerini çıkaran daha gelişmiş bir yöntem kullanılabilir
    
    // Alan adından olası e-posta adresi oluştur
    try {
        if (!website) return null;
        
        const url = new URL(website);
        const domain = url.hostname.replace('www.', '');
        
        // Türkçe karakterleri düzelt
        const normalizedDomain = domain
            .replace(/ı/g, 'i')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/İ/g, 'I');
        
        // Yaygın e-posta formatları
        const possibleEmails = [
            `info@${normalizedDomain}`,
            `iletisim@${normalizedDomain}`,
            `bilgi@${normalizedDomain}`,
            `contact@${normalizedDomain}`,
            `destek@${normalizedDomain}`,
            `support@${normalizedDomain}`,
            `merhaba@${normalizedDomain}`,
            `hello@${normalizedDomain}`
        ];
        
        return possibleEmails[0]; // İlk olasılığı döndür
    } catch (error) {
        console.warn('E-posta adresi çıkarılamadı:', error);
        return null;
    }
}

// Telefon numarasını bağlantı için formatla
function formatPhoneNumberForLink(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Tüm boşlukları, parantezleri ve tireleri kaldır
    return phoneNumber.replace(/[\s\(\)\-]/g, '');
}

// Adres bileşenlerini ayrıştır
function parseAddressComponents(addressComponents) {
    if (!addressComponents || !Array.isArray(addressComponents)) {
        return null;
    }
    
    const result = {
        street_number: '',
        route: '',
        neighborhood: '',
        locality: '',
        administrative_area_level_1: '',
        country: '',
        postal_code: ''
    };
    
    addressComponents.forEach(component => {
        if (component.types.includes('street_number')) {
            result.street_number = component.long_name;
        } else if (component.types.includes('route')) {
            result.route = component.long_name;
        } else if (component.types.includes('neighborhood')) {
            result.neighborhood = component.long_name;
        } else if (component.types.includes('locality')) {
            result.locality = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
            result.administrative_area_level_1 = component.long_name;
        } else if (component.types.includes('country')) {
            result.country = component.long_name;
        } else if (component.types.includes('postal_code')) {
            result.postal_code = component.long_name;
        }
    });
    
    return result;
}

// İşletmeleri ara
async function searchBusinesses(type, location, filters = {}) {
    try {
        // Map yüklü değilse yükle
        if (!map) {
            await loadGoogleMapsAPI();
            initMap();
        }

        const cacheKey = `${type}-${location}-${JSON.stringify(filters)}`;
        
        // Önbellekte varsa ve süresi geçmediyse, önbellekten döndür
        const cachedData = apiCache.get(cacheKey);
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
            console.log('Arama sonuçları önbellekten alındı:', cacheKey);
            return cachedData.data;
        }

        // Places Service için container div'i kontrol et
        let mapDiv = document.getElementById('google-maps-container');
        if (!mapDiv) {
            console.log('Google Maps container bulunamadı, yeniden oluşturuluyor');
            initMap();
            mapDiv = document.getElementById('google-maps-container');
        }
        
        // Koordinatları al
        const coordinates = await geocodeLocation(location);
        
        // PlacesService oluştur
        const service = new google.maps.places.PlacesService(map);
        
        // TextSearch için request parametrelerini düzenle
        const request = {
            query: `${type} ${location}`, // Arama terimini ve konumu birleştir
            language: 'tr',
            region: 'TR'
        };
        
        console.log('Places API arama isteği gönderiliyor:', request);

        const results = await new Promise((resolve, reject) => {
            service.textSearch(request, (results, status, pagination) => {
                console.log('Places API arama yanıtı:', status, results ? results.length : 0);
                
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    // İlk sonuçları al
                    let allResults = [...results];
                    
                    // Sayfalama varsa ve sonraki sayfa mevcutsa
                    if (pagination && pagination.hasNextPage) {
                        let paginationAttempts = 0;
                        const maxPaginationAttempts = 5; // Maksimum sayfalama denemesi (3'ten 5'e çıkarıldı)
                        const maxResults = 100; // Maksimum sonuç sayısı (60'tan 100'e çıkarıldı)
                        
                        const getNextPage = () => {
                            // Maksimum sonuç sayısına ulaşıldıysa veya maksimum deneme sayısına ulaşıldıysa dur
                            if (allResults.length >= maxResults || paginationAttempts >= maxPaginationAttempts) {
                                console.log(`Sayfalama tamamlandı. Toplam sonuç: ${allResults.length}, Deneme sayısı: ${paginationAttempts}, Maksimum sonuç: ${maxResults}`);
                                return resolve(allResults);
                            }
                            
                            paginationAttempts++;
                            console.log(`Sayfalama denemesi ${paginationAttempts}/${maxPaginationAttempts}`);
                            
                            try {
                                pagination.nextPage((moreResults, status) => {
                                    console.log(`Sayfalama yanıtı (${paginationAttempts}): ${status}, Sonuç sayısı: ${moreResults ? moreResults.length : 0}`);
                                    
                                    if (status === google.maps.places.PlacesServiceStatus.OK && moreResults && moreResults.length > 0) {
                                        // Yeni sonuçları ekle
                                        allResults = [...allResults, ...moreResults];
                                        
                                        // Daha fazla sayfa varsa devam et
                                        if (pagination.hasNextPage) {
                                            // Bekleme süresini artır (500ms'den 800ms'ye)
                                            setTimeout(getNextPage, 800); // Rate limit için bekleme süresini artır
                                        } else {
                                            console.log('Daha fazla sayfa yok, sayfalama tamamlandı');
                                            resolve(allResults);
                                        }
                                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                        // ZERO_RESULTS durumunda mevcut sonuçları döndür
                                        console.log('Sayfalamada sonuç yok (ZERO_RESULTS), mevcut sonuçlar döndürülüyor');
                                        resolve(allResults);
                                    } else {
                                        // Diğer hata durumlarında da mevcut sonuçları döndür
                                        console.warn(`Sayfalama hatası: ${status}, mevcut sonuçlar döndürülüyor`);
                                        resolve(allResults);
                                    }
                                });
                            } catch (error) {
                                console.error('Sayfalama hatası:', error);
                                resolve(allResults); // Hata durumunda mevcut sonuçları döndür
                            }
                        };
                        
                        // İlk sayfalama denemesini başlat
                        getNextPage();
                    } else {
                        // Sayfalama yoksa mevcut sonuçları döndür
                        console.log('Sayfalama yok, mevcut sonuçlar döndürülüyor');
                        resolve(allResults);
                    }
                } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    console.log('Arama sonucu bulunamadı (ZERO_RESULTS)');
                    resolve([]);
                } else {
                    console.error('Arama hatası:', status);
                    reject(new Error('İşletme araması başarısız: ' + status));
                }
            });
        });
        
        console.log('Arama tamamlandı, sonuç sayısı:', results.length);

        // Eksik place_id'leri tamamla
        const processedResults = results.map(result => {
            // place_id yoksa oluştur
            if (!result.place_id) {
                console.warn('Eksik place_id tespit edildi, geçici ID oluşturuluyor:', result.name);
                
                // Firma adı ve adresinden benzersiz bir ID oluştur
                const tempId = 'ChIJ_' + btoa(result.name + (result.formatted_address || '')).replace(/[+/=]/g, '').substring(0, 20);
                
                // Geçici place_id ekle
                result.place_id = tempId;
                result._isTemporaryId = true; // Bu ID'nin geçici olduğunu işaretle
            }
            
            // Eksik telefon numarası için alternatif alanları kontrol et
            if (!result.formatted_phone_number && result.international_phone_number) {
                result.formatted_phone_number = result.international_phone_number;
            }
            
            // Web sitesi varsa e-posta adresi oluştur
            if (result.website && !result.email) {
                try {
                    result.email = extractEmailFromWebsite(result.website);
                } catch (error) {
                    console.warn('E-posta adresi oluşturulamadı:', error);
                }
            }
            
            // Adres bilgisi için alternatif alanları kontrol et
            if (!result.formatted_address && result.vicinity) {
                result.formatted_address = result.vicinity;
            }
            
            return result;
        });
        
        // place_id değerlerini kontrol et ve geçersiz olanları filtrele
        const validResults = processedResults.filter(result => {
            if (!result.place_id) {
                console.warn('Geçersiz sonuç: place_id yok', result);
                return false;
            }
            
            return true;
        });
        
        if (validResults.length < results.length) {
            console.log(`${results.length - validResults.length} geçersiz sonuç filtrelendi`);
        }

        // Sonuçları filtrele
        let filteredResults = validResults;
        
        // Alakalılık skoruna göre sırala
        filteredResults = filteredResults.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const searchTerm = type.toLowerCase();
            
            // İsimde arama terimi geçiyorsa önceliklendir
            const aContainsTerm = aName.includes(searchTerm);
            const bContainsTerm = bName.includes(searchTerm);
            
            if (aContainsTerm && !bContainsTerm) return -1;
            if (!aContainsTerm && bContainsTerm) return 1;
            
            // Sonra puana göre sırala
            return (b.rating || 0) - (a.rating || 0);
        });
        
        if (filters.rating) {
            filteredResults = filteredResults.filter(place => 
                place.rating >= parseFloat(filters.rating)
            );
        }

        if (filters.hasWebsite) {
            filteredResults = filteredResults.filter(place => place.website);
        }

        if (filters.hasPhone) {
            filteredResults = filteredResults.filter(place => 
                place.formatted_phone_number
            );
        }

        // Sonuçları önbelleğe al
        apiCache.set(cacheKey, {
            data: filteredResults,
            timestamp: Date.now()
        });
        
        console.log(`Arama sonuçları önbelleğe alındı. Anahtar: ${cacheKey}, Sonuç sayısı: ${filteredResults.length}`);
        
        return filteredResults;
    } catch (error) {
        console.error('İşletme araması hatası:', error);
        throw new Error('İşletme araması başarısız: ' + error.message);
    }
}

// Konum kodlama için önbellek
const geocodeCache = new Map();

// Konumu koordinatlara dönüştür
async function geocodeLocation(address) {
    try {
        // Önbellekte varsa döndür
        if (geocodeCache.has(address)) {
            return geocodeCache.get(address);
        }

        const geocoder = new google.maps.Geocoder();
        
        const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ address, region: 'TR' }, (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results[0]) {
                    resolve(results[0].geometry.location);
                } else {
                    reject(new Error('Konum bulunamadı: ' + status));
                }
            });
        });

        // Sonucu önbelleğe al
        geocodeCache.set(address, result);

        return result;
    } catch (error) {
        console.error('Konum kodlama hatası:', error);
        throw new Error('Konum kodlama başarısız: ' + error.message);
    }
}

// Firma Değerlendirmelerini Getir
async function getCompanyRatings(placeId) {
    try {
        const { data, error } = await supabase
            .from('company_ratings')
            .select('*')
            .eq('place_id', placeId);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Değerlendirme getirme hatası:', error);
        return [];
    }
}

// Firma Yorumlarını Getir
async function getCompanyReviews(placeId) {
    try {
        // Önce Google Places API'den yorumları almayı deneyelim
        try {
            const business = await getBusinessDetails(placeId);
            if (business && business.reviews && business.reviews.length > 0) {
                console.log('Google Places API\'den yorumlar alındı:', business.reviews.length);
                return business.reviews;
            }
        } catch (error) {
            console.warn('Google Places API\'den yorumlar alınamadı:', error);
        }
        
        // Supabase'den yorumları alalım
        console.log('Supabase\'den yorumlar alınıyor...');
        const { data, error } = await supabase
            .from('company_reviews')
            .select('*')  // profiles tablosu ile ilişki kaldırıldı
            .eq('place_id', placeId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Supabase yorum getirme hatası:', error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            console.log('Supabase\'de yorum bulunamadı');
            return [];
        }
        
        console.log('Supabase\'den yorumlar alındı:', data.length);
        
        // Kullanıcı bilgilerini ayrı bir sorgu ile alalım
        const userIds = data.map(review => review.user_id).filter(Boolean);
        let userMap = {};
        
        if (userIds.length > 0) {
            try {
                const { data: users, error: userError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);
                
                if (!userError && users) {
                    userMap = users.reduce((acc, user) => {
                        acc[user.id] = user.full_name;
                        return acc;
                    }, {});
                }
            } catch (userError) {
                console.warn('Kullanıcı bilgileri alınamadı:', userError);
            }
        }
        
        // Yorumları formatla
        return data.map(review => ({
            id: review.id,
            author_name: userMap[review.user_id] || review.author_name || 'Anonim',
            rating: review.rating,
            text: review.comment,
            time: review.created_at ? new Date(review.created_at).getTime() / 1000 : null,
            user_id: review.user_id
        }));
    } catch (error) {
        console.error('Yorum getirme hatası:', error);
        return [];
    }
}

// Yorum Ekle
async function addCompanyReview(placeId, rating, comment) {
    try {
        // Kullanıcı kontrolü
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('Yorum eklemek için giriş yapmalısınız');
        }
        
        console.log('Yorum ekleniyor:', { placeId, rating, comment, userId: user.id });
        
        // Kullanıcı profil bilgilerini al
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
            
        if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profil bilgisi alınamadı:', profileError);
        }
        
        const authorName = profileData?.full_name || user.email || 'Kullanıcı';
        
        // Yorum ekle
        const { data, error } = await supabase
            .from('company_reviews')
            .insert([{
                place_id: placeId,
                user_id: user.id,
                author_name: authorName,
                rating: rating,
                comment: comment,
                created_at: new Date().toISOString()
            }]);
            
        if (error) {
            console.error('Yorum ekleme hatası:', error);
            throw error;
        }
        
        console.log('Yorum başarıyla eklendi');
        
        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Firmaları Kaydet
async function saveCompanies(companies, userId) {
    try {
        // Kullanıcı kontrolü
        if (!userId) {
            return {
                success: false,
                error: 'Kullanıcı kimliği bulunamadı'
            };
        }
        
        // Firma kontrolü
        if (!companies || companies.length === 0) {
            return {
                success: false,
                error: 'Kaydedilecek firma bulunamadı'
            };
        }
        
        // Firmaları hazırla
        const companyData = companies.map(company => ({
            place_id: company.place_id,
            name: company.name,
            address: company.address || company.formatted_address || company.vicinity || '',
            website: company.website || '',
            phone: company.phone || company.formatted_phone_number || '',
            rating: company.rating || 0,
            reviews: company.reviews || company.user_ratings_total || 0,
            user_id: userId,
            created_at: new Date().toISOString()
        }));
        
        // Supabase'e firmaları kaydet
        const { data, error } = await supabase
            .from('saved_companies')
            .insert(companyData);
            
        if (error) {
            console.error('Supabase kayıt hatası:', error);
            throw error;
        }
        
        return {
            success: true,
            savedCount: companies.length,
            data: data
        };
    } catch (error) {
        console.error('Firmalar kaydedilirken hata oluştu:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Kaydedilen Firmaları Sil
async function deleteCompanies(companyIds, userId) {
    try {
        console.log('Firmalar siliniyor:', companyIds);
        
        // Supabase'den sil
        const { data, error } = await supabase
            .from('saved_companies')
            .delete()
            .in('id', companyIds)
            .eq('user_id', userId);
        
        if (error) throw error;
        
        return {
            success: true,
            deletedCount: companyIds.length
        };
    } catch (error) {
        console.error('Firma silme hatası:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// E-posta Gönder
async function sendEmail(recipients, subject, content) {
    try {
        console.log('E-posta gönderiliyor:', recipients, subject);
        
        // Tarayıcı ortamında Gmail API kullanımı için
        // Burada bir backend API'ye istek gönderebilirsiniz
        // Örnek olarak, bir simülasyon yapıyoruz
        
        // Gerçek bir uygulamada, aşağıdaki gibi bir fetch isteği yapabilirsiniz:
        /*
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipients,
                subject,
                content
            }),
        });
        
        const result = await response.json();
        return result;
        */
        
        // Simüle edilmiş gecikme (gerçek bir API çağrısı gibi davranması için)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // E-posta içeriğini konsola yazdır (geliştirme amaçlı)
        console.log('E-posta Konusu:', subject);
        console.log('E-posta İçeriği:', content);
        console.log('Alıcılar:', recipients);
        
        // Başarılı yanıt döndür
        return {
            success: true,
            sentCount: Array.isArray(recipients) ? recipients.length : 1,
            message: 'E-postalar başarıyla gönderildi (simülasyon)'
        };
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Aramayı Kaydet
async function saveSearch(query, location, resultCount) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase
            .from('searches')
            .insert([{
                user_id: user.id,
                query: query,
                location: location,
                result_count: resultCount,
                created_at: new Date().toISOString()
            }]);
            
        if (error) throw error;
    } catch (error) {
        console.error('Arama kaydedilirken hata oluştu:', error);
    }
}

// Arama Geçmişini Getir
async function getSearchHistory(userId, limit = 5) {
    try {
        console.log('Arama geçmişi getiriliyor');
        
        // Supabase'den getir
        const { data, error } = await supabase
            .from('searches')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        
        return {
            success: true,
            searches: data
        };
    } catch (error) {
        console.error('Arama geçmişi getirme hatası:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Kaydedilen Firmaları Getir
async function getSavedCompanies(userId) {
    try {
        console.log('Kaydedilen firmalar getiriliyor');
        
        // Supabase'den getir
        const { data, error } = await supabase
            .from('saved_companies')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return {
            success: true,
            companies: data
        };
    } catch (error) {
        console.error('Kaydedilen firmaları getirme hatası:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Yardımcı fonksiyonlar
function generateRandomName() {
    const names = ['Ahmet Y.', 'Mehmet S.', 'Ayşe K.', 'Fatma B.', 'Ali R.', 'Zeynep M.', 'Can D.', 'Ece P.'];
    return names[Math.floor(Math.random() * names.length)];
}

function generateRandomDate() {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toLocaleDateString('tr-TR');
}

function generateRandomComment() {
    const comments = [
        'Harika bir firma, çok profesyonel çalışıyorlar.',
        'Projemizi zamanında ve eksiksiz tamamladılar.',
        'Teknik ekipleri çok bilgili ve yardımsever.',
        'İş takipleri ve iletişimleri çok iyi.',
        'Kaliteli hizmet, kesinlikle tavsiye ederim.'
    ];
    return comments[Math.floor(Math.random() * comments.length)];
}

function generateRandomPhone() {
    return `+90 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateRandomWebsite(companyName) {
    const domain = companyName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
    return `https://www.${domain}.com.tr`;
}

function generateRandomEmail(companyName) {
    const domain = companyName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
    return `info@${domain}.com.tr`;
}

function generateRandomWorkingHours() {
    return {
        weekday: '09:00 - 18:00',
        saturday: '10:00 - 14:00',
        sunday: 'Kapalı'
    };
}

function generateRandomSocialMedia(companyName) {
    const cleanName = companyName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
        
    return {
        facebook: place.extratags?.['contact:facebook'] || `facebook.com/${cleanName}`,
        twitter: place.extratags?.['contact:twitter'] || `twitter.com/${cleanName}`,
        linkedin: place.extratags?.['contact:linkedin'] || `linkedin.com/company/${cleanName}`,
        instagram: place.extratags?.['contact:instagram'] || `instagram.com/${cleanName}`
    };
}

// Google Maps JavaScript API'yi yükle
function loadGoogleMapsAPI() {
    // Eğer API zaten yüklüyse
    if (window.googleMapsLoaded) {
        console.log('Google Maps API zaten yüklenmiş durumda (global flag)');
        return Promise.resolve();
    }
    
    // Eğer zaten bir yükleme işlemi devam ediyorsa, onu kullan
    if (window.googleMapsAPIPromise) {
        console.log('Google Maps API yükleme işlemi zaten devam ediyor, mevcut Promise kullanılıyor');
        return window.googleMapsAPIPromise;
    }
    
    // Yeni bir Promise oluştur ve global değişkene kaydet
    window.googleMapsAPIPromise = new Promise((resolve, reject) => {
        // API zaten yüklüyse
        if (window.google && window.google.maps && window.google.maps.places) {
            console.log('Google Maps API zaten yüklü');
            resolve();
            return;
        }
        
        // Daha önce script eklenmiş mi kontrol et
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existingScript) {
            console.log('Google Maps API script etiketi zaten eklenmiş, yüklenmesini bekliyoruz');
            
            // Eğer script hatalıysa veya yüklenemiyorsa, yeniden yüklemeyi dene
            if (existingScript.getAttribute('data-failed') === 'true') {
                console.log('Önceki script yüklenemedi, kaldırılıp yeniden yüklenecek');
                existingScript.remove();
            } else {
                // Script yükleniyor, bekleyelim
                const checkGoogleInterval = setInterval(() => {
                    if (window.google && window.google.maps && window.google.maps.places) {
                        console.log('Google Maps API yüklendi (interval ile kontrol)');
                        clearInterval(checkGoogleInterval);
                        resolve();
                    }
                }, 500); // Kontrol aralığını artırdık (100ms -> 500ms)
                
                // 60 saniye sonra hala yüklenmediyse hata ver (zaman aşımı süresini artırdık)
                setTimeout(() => {
                    clearInterval(checkGoogleInterval);
                    console.error('Google Maps API yükleme zaman aşımı');
                    
                    // Script'i başarısız olarak işaretle
                    existingScript.setAttribute('data-failed', 'true');
                    
                    // Script'i kaldır ve yeniden yüklemeyi dene
                    existingScript.remove();
                    
                    // Yeni bir yükleme denemesi başlat
                    console.log('Yeni bir yükleme denemesi başlatılıyor...');
                    loadGoogleMapsAPIDirectly().then(resolve).catch(reject);
                }, 60000); // 60 saniye (30 saniye -> 60 saniye)
                
                return;
            }
        }
        
        // Doğrudan yükleme fonksiyonunu çağır
        loadGoogleMapsAPIDirectly().then(resolve).catch(reject);
    });
    
    return window.googleMapsAPIPromise;
}

// Google Maps API'yi doğrudan yükleme fonksiyonu
function loadGoogleMapsAPIDirectly() {
    return new Promise((resolve, reject) => {
        console.log('Google Maps API doğrudan yükleniyor...');
        
        // Google'ın önerdiği yeni yükleme yöntemi
        // https://developers.google.com/maps/documentation/javascript/load-maps-js-api
        const googleMapsCallback = 'initGoogleMapsAPI_' + Math.random().toString(36).substring(2, 15);
        
        // API yükleme callback'i
        window[googleMapsCallback] = function() {
            // API yüklendi ama Places API etkin değilse
            if (window.google && window.google.maps && !window.google.maps.places) {
                console.error('Google Places API etkinleştirilmemiş');
                reject(new Error('Google Places API etkinleştirilmemiş. Lütfen Google Cloud Console\'da Places API (New)\'yi etkinleştirin: https://console.cloud.google.com/apis/library'));
                return;
            }
            
            console.log('Google Maps API başarıyla yüklendi');
            // API yükleme durumunu güncelle
            window.googleMapsLoaded = true;
            resolve();
            // Callback'i temizle
            delete window[googleMapsCallback];
        };
        
        // Script elementini oluştur
        const script = document.createElement('script');
        script.id = 'google-maps-api-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=${googleMapsCallback}&loading=async&language=tr&v=weekly`;
        script.async = true;
        script.defer = true;
        
        // API yükleme hatası
        script.onerror = function() {
            console.error('Google Maps API yüklenemedi');
            script.setAttribute('data-failed', 'true');
            reject(new Error('Google Maps JavaScript API yüklenemedi. Lütfen API anahtarınızı ve internet bağlantınızı kontrol edin.'));
        };
        
        // API hata yakalama
        window.gm_authFailure = function() {
            const errorMessage = 'Google Maps API yetkilendirme hatası. Lütfen API anahtarınızı kontrol edin ve Google Cloud Console\'da Places API (New)\'yi etkinleştirin: https://console.cloud.google.com/apis/library';
            console.error(errorMessage);
            
            // Script'i başarısız olarak işaretle
            const scriptElement = document.getElementById('google-maps-api-script');
            if (scriptElement) {
                scriptElement.setAttribute('data-failed', 'true');
            }
            
            reject(new Error(errorMessage));
        };
        
        // Belgeye ekle
        document.head.appendChild(script);
        console.log('Google Maps API script etiketi eklendi');
    });
}

// Kaydedilen firmayı sil
async function deleteCompany(companyId, userId) {
    try {
        const { error } = await supabase
            .from('saved_companies')
            .delete()
            .eq('id', companyId)
            .eq('user_id', userId);
            
        if (error) {
            console.error('Firma silinemedi:', error);
            showNotification('Firma silinemedi: ' + error.message, 'danger');
            return false;
        }
        
        showNotification('Firma başarıyla silindi', 'success');
        return true;
    } catch (error) {
        console.error('Firma silme hatası:', error);
        showNotification('Firma silinirken bir hata oluştu', 'danger');
        return false;
    }
}

// Son aramaları yükle
async function loadRecentSearches(user) {
    const recentSearchesContainer = document.getElementById('recent-searches');
    
    if (!recentSearchesContainer) return;
    
    try {
        // Son aramaları veritabanından çek
        const { data: searches, error } = await supabase
            .from('searches')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) {
            console.error('Son aramalar yüklenemedi:', error);
            return;
        }
        
        if (searches.length === 0) {
            recentSearchesContainer.innerHTML = `
                <div class="text-center py-3">
                    <small class="text-muted">Henüz arama geçmişi bulunmuyor</small>
                </div>
            `;
            return;
        }
        
        // Aramaları listele
        recentSearchesContainer.innerHTML = '';
        searches.forEach(search => {
            const searchItem = document.createElement('div');
            searchItem.className = 'search-item d-flex justify-content-between align-items-center py-2 border-bottom';
            searchItem.innerHTML = `
                <div>
                    <div class="search-query">${search.query}</div>
                    <small class="text-muted">${search.location} - ${search.result_count} sonuç</small>
                </div>
                <button class="btn btn-sm btn-outline-primary repeat-search-btn" 
                        data-query="${search.query}" 
                        data-location="${search.location}">
                    <i class="bi bi-search"></i>
                </button>
            `;
            
            recentSearchesContainer.appendChild(searchItem);
        });
        
        // Arama tekrarlama butonlarına olay dinleyicisi ekle
        const repeatButtons = recentSearchesContainer.querySelectorAll('.repeat-search-btn');
        repeatButtons.forEach(button => {
            button.addEventListener('click', function() {
                const query = this.getAttribute('data-query');
                const location = this.getAttribute('data-location');
                
                // Arama sayfasına yönlendir
                changeView('search');
                
                // Arama formunu doldur
                document.getElementById('business-type').value = query;
                document.getElementById('location').value = location;
                
                // Aramayı başlat
                setTimeout(() => {
                    handleSearch();
                }, 300);
            });
        });
        
    } catch (error) {
        console.error('Son aramalar yüklenirken bir hata oluştu:', error);
    }
}

// Toplu E-posta Gönder
async function sendBulkEmail(recipientsList, subject, content, options = {}) {
    try {
        console.log('Toplu e-posta gönderiliyor:', recipientsList.length, 'alıcı');
        
        // Simüle edilmiş gecikme (gerçek bir API çağrısı gibi davranması için)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // E-posta içeriğini konsola yazdır (geliştirme amaçlı)
        console.log('Toplu E-posta Konusu:', subject);
        console.log('Toplu E-posta İçeriği:', content);
        console.log('Alıcı Sayısı:', recipientsList.length);
        
        if (options.progressCallback && typeof options.progressCallback === 'function') {
            // İlerleme durumunu bildirmek için callback fonksiyonu
            for (let i = 0; i < recipientsList.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Her e-posta için kısa bir gecikme
                options.progressCallback({
                    current: i + 1,
                    total: recipientsList.length,
                    percent: Math.round(((i + 1) / recipientsList.length) * 100)
                });
            }
        }
        
        // Başarılı yanıt döndür
        return {
            success: true,
            sentCount: recipientsList.length,
            message: 'Toplu e-postalar başarıyla gönderildi (simülasyon)'
        };
    } catch (error) {
        console.error('Toplu e-posta gönderme hatası:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Fonksiyonları dışa aktar - Tarayıcı ortamında module.exports kullanılamaz
// Bunun yerine window nesnesi üzerinden fonksiyonları global olarak erişilebilir yapıyoruz
if (typeof window !== 'undefined') {
    // Tarayıcı ortamı
    window.apiUtils = {
        sendEmail,
        sendBulkEmail
    };
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js ortamı
    module.exports = {
        sendEmail,
        sendBulkEmail
    };
} 