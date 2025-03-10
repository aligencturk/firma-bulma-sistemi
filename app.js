// Uygulama Başlatma ve Yapılandırma
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Uygulama başlatılıyor...');
        
        // Supabase İstemcisini Başlat
        await initSupabase();
        
        // Görünüm Yöneticisini Başlat
        initViewManager();
        
        // Oturum Durumunu Kontrol Et
        await checkAuthState();
        
        // Olay Dinleyicilerini Ekle
        addEventListeners();
        
        console.log('Uygulama başarıyla başlatıldı');
    } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
        showNotification('Uygulama başlatılırken bir hata oluştu: ' + error.message, 'danger');
    }
});

// Supabase İstemcisini Başlat
async function initSupabase() {
    try {
        // Google Places API anahtarı
        const googleApiKey = 'AIzaSyDJ86Sq941naHo8LyVTq4CZKV-C38RpPGo';
        window.googleApiKey = googleApiKey; // Global erişim için
        
        // Supabase anahtarları
        const supabaseUrl = 'https://cymktzhwntyctqwdvjrs.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bWt0emh3bnR5Y3Rxd2R2anJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTg2MzAsImV4cCI6MjA1Njg3NDYzMH0.j-PRPVLv2vY84NuKegX1iEZH_x8ZPWyhGLJYH41pLHo';
        
        // Global Supabase istemcisini oluştur
        window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
        
        console.log('Supabase istemcisi başlatıldı');
        
        // Google Places API'yi yükle
        try {
            await loadGooglePlacesAPI(googleApiKey);
            console.log('Google Places API başarıyla yüklendi ve hazır');
        } catch (error) {
            console.error('Google Places API yüklenemedi:', error);
            showNotification('Google Places API yüklenemedi: ' + error.message, 'warning');
            // API yüklenemese bile uygulamanın çalışmasına izin ver
        }
    } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
        showNotification('Uygulama başlatılamadı: ' + error.message, 'danger');
    }
}

// Google Places API'yi yükle
function loadGooglePlacesAPI(apiKey) {
    return new Promise((resolve, reject) => {
        // API zaten yüklüyse
        if (window.google && window.google.maps && window.google.maps.places) {
            console.log('Google Places API zaten yüklenmiş');
            initPlacesService();
            resolve();
            return;
        }
        
        // Global flag kontrolü
        if (window.googleMapsLoaded) {
            console.log('Google Maps API zaten yüklenmiş (global flag)');
            initPlacesService();
            resolve();
            return;
        }
        
        // api.js'deki loadGoogleMapsAPI fonksiyonunu kullan
        if (typeof loadGoogleMapsAPI === 'function') {
            console.log('api.js üzerinden Google Maps API yükleniyor');
            loadGoogleMapsAPI()
                .then(() => {
                    console.log('Google Places API başarıyla yüklendi (api.js üzerinden)');
                    initPlacesService();
                    resolve();
                })
                .catch((error) => {
                    console.error('Google Maps API yüklenemedi:', error);
                    showNotification('Google Places API yüklenemedi: ' + error.message, 'danger');
                    reject(error);
                });
            return;
        }
        
        // Eğer api.js yüklü değilse, kendi yükleme kodunu çalıştır
        console.log('api.js bulunamadı, doğrudan yükleme yapılıyor');
        
        // Daha önce script eklenmiş mi kontrol et
        if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
            console.log('Google Maps API script etiketi zaten eklenmiş, yüklenmeyi bekliyorum');
            // Script yükleniyor, bekleyelim
            const checkGoogleInterval = setInterval(() => {
                if (window.google && window.google.maps && window.google.maps.places) {
                    clearInterval(checkGoogleInterval);
                    console.log('Google Places API başarıyla yüklendi (interval)');
                    initPlacesService();
                    resolve();
                }
            }, 100);
            
            // 10 saniye sonra hala yüklenmediyse hata ver
            setTimeout(() => {
                if (!window.google || !window.google.maps || !window.google.maps.places) {
                    clearInterval(checkGoogleInterval);
                    const errorMsg = 'Google Maps JavaScript API yükleme zaman aşımı';
                    console.error(errorMsg);
                    showNotification('Google Places API yüklenemedi', 'danger');
                    reject(new Error(errorMsg));
                }
            }, 10000);
            
            return;
        }
        
        // Google'ın önerdiği callback yöntemi
        const googleMapsCallback = 'initGoogleMapsAPI_' + Math.random().toString(36).substring(2, 15);
        
        // API yükleme callback'i
        window[googleMapsCallback] = function() {
            try {
                console.log('Google Places API callback çağrıldı');
                if (window.google && window.google.maps && window.google.maps.places) {
                    console.log('Google Places API başarıyla yüklendi (callback)');
                    initPlacesService();
                    resolve();
                } else {
                    const errorMsg = 'Google Places API etkinleştirilmemiş';
                    console.error(errorMsg);
                    showNotification(errorMsg, 'danger');
                    reject(new Error(errorMsg));
                }
            } catch (error) {
                console.error('Google Maps callback hatası:', error);
                showNotification('Google Maps API hatası: ' + error.message, 'danger');
                reject(error);
            } finally {
                // Callback'i temizle
                delete window[googleMapsCallback];
            }
        };
        
        try {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${googleMapsCallback}&v=weekly&language=tr`;
            script.async = true;
            script.defer = true;
            
            script.onerror = (error) => {
                const errorMsg = 'Google Places API yüklenirken hata oluştu';
                console.error(errorMsg, error);
                showNotification(errorMsg, 'danger');
                reject(new Error(errorMsg));
            };
            
            // API hata yakalama
            window.gm_authFailure = function() {
                const errorMsg = 'Google Maps API yetkilendirme hatası. Lütfen API anahtarınızı kontrol edin.';
                console.error(errorMsg);
                showNotification(errorMsg, 'danger');
                reject(new Error(errorMsg));
            };
            
            document.head.appendChild(script);
            console.log('Google Maps API script etiketi eklendi');
        } catch (error) {
            console.error('Script oluşturma hatası:', error);
            showNotification('Google Maps API yüklenemedi: ' + error.message, 'danger');
            reject(error);
        }
    });
}

// Places servisini başlat
function initPlacesService() {
    try {
        // Google API'nin yüklendiğinden emin ol
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            console.error('Google Places API henüz yüklenmemiş');
            return;
        }
        
        // Görünmez bir div oluştur
        const placesDiv = document.createElement('div');
        placesDiv.style.display = 'none';
        document.body.appendChild(placesDiv);
        
        window.placesService = new google.maps.places.PlacesService(placesDiv);
        console.log('Places servisi başarıyla başlatıldı');
    } catch (error) {
        console.error('Places servisi başlatılırken hata:', error);
        showNotification('Places servisi başlatılamadı: ' + error.message, 'danger');
    }
}

// Görünüm Yöneticisini Başlat
function initViewManager() {
    // Tüm görünümleri gizle
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        if (view.id !== 'dashboard-view') {
            view.classList.add('d-none');
        }
    });
    
    // Görünüm değiştirme bağlantılarını ayarla
    const viewLinks = document.querySelectorAll('[data-view]');
    viewLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.getAttribute('data-view');
            changeView(viewName);
        });
    });
    
    console.log('Görünüm yöneticisi başlatıldı');
}

// Görünüm Değiştir
function changeView(viewName) {
    // Tüm görünümleri gizle
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.add('d-none'));
    
    // Tüm navigasyon bağlantılarını pasif yap
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // İstenen görünümü göster
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.remove('d-none');
        
        // İlgili navigasyon bağlantısını aktif yap
        const activeNavLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
        
        console.log(`Görünüm değiştirildi: ${viewName}`);
    } else {
        console.error(`Görünüm bulunamadı: ${viewName}`);
    }
}

// Olay Dinleyicilerini Ekle
function addEventListeners() {
    // Giriş Formu
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Kayıt Formu
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Şifremi Unuttum Bağlantısı
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }
    
    // Çıkış Butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Hızlı Arama Formu
    const quickSearchForm = document.getElementById('quick-search-form');
    if (quickSearchForm) {
        quickSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Form verilerini al
            const inputs = quickSearchForm.querySelectorAll('input, select');
            const formData = {};
            
            inputs.forEach(input => {
                formData[input.id || input.name || 'query'] = input.value;
            });
            
            // Arama sayfasına yönlendir ve form verilerini doldur
            changeView('search');
            
            // Arama formunu doldur
            if (formData.query) {
                document.getElementById('business-type').value = formData.query;
            }
            
            if (formData['quick-location']) {
                document.getElementById('location').value = formData['quick-location'];
            }
            
            // Aramayı başlat
            const searchForm = document.getElementById('search-form');
            if (searchForm) {
                searchForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    // Arama Formu
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // E-posta Gönderme Butonu
    const sendEmailBtn = document.getElementById('send-email-btn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', handleSendEmail);
    }
    
    // WhatsApp Gönderme Butonu
    const sendWhatsAppBtn = document.getElementById('send-whatsapp-btn');
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', handleSendWhatsApp);
    }
    
    // Sonuçları Kaydetme Butonu
    const saveResultsBtn = document.getElementById('save-results-btn');
    if (saveResultsBtn) {
        saveResultsBtn.addEventListener('click', handleSaveResults);
    }
    
    // Filtreleri Uygulama Butonu
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const rating = document.getElementById('filter-rating').value;
            const location = document.getElementById('filter-location').value;
            
            const filters = {
                rating: rating,
                location: location
            };
            
            filterSearchResults(filters);
        });
    }
    
    // Checkbox değişikliklerini dinle
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('company-checkbox')) {
            updateBulkActionButtons();
        }
    });
}

// Bildirim Göster
function showNotification(message, type = 'success') {
    // Bootstrap Toast bileşeni oluştur
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3 notification-area';
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    const toastBody = document.createElement('div');
    toastBody.className = 'd-flex';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-body';
    messageDiv.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Kapat');
    
    toastBody.appendChild(messageDiv);
    toastBody.appendChild(closeButton);
    toastEl.appendChild(toastBody);
    toastContainer.appendChild(toastEl);
    
    // Mevcut bildirim alanını kontrol et
    const existingNotificationArea = document.querySelector('.notification-area');
    if (existingNotificationArea) {
        existingNotificationArea.appendChild(toastEl);
    } else {
        document.body.appendChild(toastContainer);
    }
    
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 5000
    });
    
    toast.show();
    
    // Toast kapandığında DOM'dan kaldır
    toastEl.addEventListener('hidden.bs.toast', () => {
        if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
            
            // Eğer container boşsa ve body'nin doğrudan child'ı ise kaldır
            if (toastContainer.children.length === 0 && toastContainer.parentNode === document.body) {
                document.body.removeChild(toastContainer);
            }
        }
    });
    
    return { toastEl, messageDiv, toastContainer };
}

// Yükleme Göstergesi
function showLoading(container) {
    // Mevcut içeriği temizle
    container.innerHTML = '';
    
    // Yükleme göstergesini oluştur
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'text-center p-4';
    loadingSpinner.innerHTML = '<div class="loading-spinner"></div><p class="mt-2">Yükleniyor...</p>';
    
    container.appendChild(loadingSpinner);
}

// Yükleme Göstergesini Gizle
function hideLoading(container) {
    // Yükleme göstergesini içeren elementi bul ve kaldır
    const loadingElement = container.querySelector('.text-center.p-4');
    if (loadingElement) {
        container.removeChild(loadingElement);
    }
}

// Arama İşlemi
async function handleSearch() {
    // Kullanıcı oturum durumunu kontrol et
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        // Kullanıcı giriş yapmamışsa uyarı göster ve giriş sayfasına yönlendir
        showNotification('Arama yapmak için lütfen giriş yapın', 'warning');
        changeView('login');
        return;
    }
    
    // Form verilerini al
    const businessType = document.getElementById('business-type').value;
    const location = document.getElementById('location').value;
    
    // Form doğrulama
    if (!businessType || !location) {
        showNotification('Lütfen firma türü ve konum girin', 'danger');
        return;
    }
    
    // Arama sonuçları konteynerini al
    const resultsContainer = document.getElementById('search-results');
    
    // Yükleme göstergesini göster
    showLoading(resultsContainer);
    
    try {
        console.log(`Arama yapılıyor: ${businessType}, ${location}`);
        
        // Arama yap
        const results = await searchBusinesses(businessType, location);
        
        console.log(`Arama tamamlandı, ${results.length} sonuç bulundu`);
        
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Arama kriterlerinize uygun sonuç bulunamadı. Lütfen farklı anahtar kelimeler veya konum deneyin.
                </div>
            `;
            return;
        }
        
        // Sonuçları göster
        displaySearchResults(results, resultsContainer);
        
        // Filtreleme bölümünü göster
        showFilterSection(results);
        
        // Aramayı kaydet
        saveSearch(businessType, location, results.length);
        
        // Bildirim göster
        showNotification(`${results.length} firma bulundu. Google Places API her sayfada maksimum 20 sonuç gösterir, daha fazla sonuç için sayfalama kullanılır.`, 'info');
    } catch (error) {
        console.error('Arama yapılırken bir hata oluştu:', error);
        resultsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Arama yapılırken bir hata oluştu: ${error.message}
            </div>
            <div class="alert alert-warning mt-3">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Olası nedenler:</strong>
                <ul class="mt-2 mb-0">
                    <li>İnternet bağlantınızda bir sorun olabilir.</li>
                    <li>Google Places API servisi geçici olarak kullanılamıyor olabilir.</li>
                    <li>Çok fazla istek göndermiş olabilirsiniz. Biraz bekleyip tekrar deneyin.</li>
                </ul>
            </div>
        `;
    } finally {
        // Yükleme göstergesini gizle
        hideLoading(resultsContainer);
    }
}

// Arama Sonuçlarını Görüntüle
function displaySearchResults(results, container) {
    // Sonuç yoksa bilgi mesajı göster
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">Arama kriterlerinize uygun sonuç bulunamadı</p>
            </div>
        `;
        return;
    }
    
    // Geçersiz place_id'leri filtrele
    const validResults = results.filter(company => {
        if (!company.place_id) {
            console.warn('Geçersiz firma: place_id yok', company);
            return false;
        }
        
        return true;
    });
    
    if (validResults.length < results.length) {
        console.log(`${results.length - validResults.length} geçersiz sonuç filtrelendi`);
        showNotification(`${validResults.length} geçerli firma bulundu (${results.length - validResults.length} geçersiz sonuç filtrelendi)`, 'info');
    }
    
    // Filtrelenmiş sonuçlar boşsa bilgi mesajı göster
    if (validResults.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Arama sonuçları alındı ancak geçerli firma bulunamadı. Lütfen farklı arama kriterleri deneyin.
            </div>
        `;
        return;
    }
    
    // Sonuçları göster
    container.innerHTML = '';
    
    // Sonuç sayısını göster
    const resultCount = document.createElement('div');
    resultCount.className = 'alert alert-info mb-3';
    resultCount.innerHTML = `
        <i class="bi bi-info-circle me-2"></i>
        <strong>${validResults.length}</strong> firma bulundu
        <div class="mt-2 small">
            <p class="mb-1">Google Places API her sayfada maksimum 20 sonuç gösterir. Daha fazla sonuç için sayfalama kullanılır.</p>
            <p class="mb-0">Toplam sonuç sayısı 100 ile sınırlıdır. Daha spesifik arama kriterleri kullanarak sonuçları daraltabilirsiniz.</p>
        </div>
    `;
    container.appendChild(resultCount);
    
    // Geçici ID'li firmalar için uyarı göster
    const tempIdCount = validResults.filter(company => company._isTemporaryId).length;
    if (tempIdCount > 0) {
        const tempIdWarning = document.createElement('div');
        tempIdWarning.className = 'alert alert-warning mb-3';
        tempIdWarning.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>${tempIdCount}</strong> firma için tam detaylar gösterilemiyor. Bu firmalar için detay görüntüleme sınırlı olabilir.
        `;
        container.appendChild(tempIdWarning);
    }
    
    // Toplu işlem butonları
    const bulkActionsContainer = document.createElement('div');
    bulkActionsContainer.className = 'd-flex justify-content-between align-items-center mb-4 mt-3 p-3 bg-light rounded shadow-sm';
    bulkActionsContainer.innerHTML = `
        <div>
            <button class="btn btn-outline-primary me-2" id="select-all-btn">
                <i class="bi bi-check-all me-1"></i> Tümünü Seç
            </button>
            <button class="btn btn-outline-primary me-2" id="deselect-all-btn">
                <i class="bi bi-x-lg me-1"></i> Seçimi Temizle
            </button>
        </div>
        <div>
            <button class="btn btn-success me-2 whatsapp-btn" id="send-whatsapp-btn">
                <i class="bi bi-whatsapp me-1"></i> WhatsApp
            </button>
            <button class="btn btn-primary me-2 email-btn" id="send-email-btn">
                <i class="bi bi-envelope me-1"></i> E-posta
            </button>
            <button class="btn btn-outline-primary save-btn" id="save-results-btn">
                <i class="bi bi-bookmark me-1"></i> Kaydet
            </button>
        </div>
    `;
    container.appendChild(bulkActionsContainer);
    
    // Üst kısımdaki butonları aktif et
    activateTopButtons();
    
    // Sayfalama için değişkenler
    const itemsPerPage = 10; // Her sayfada gösterilecek sonuç sayısı
    const totalPages = Math.ceil(validResults.length / itemsPerPage);
    let currentPage = 1;
    
    // Sayfalama konteynerini oluştur
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container mb-3';
    container.appendChild(paginationContainer);
    
    // Sonuçları listele
    const resultsList = document.createElement('div');
    resultsList.className = 'list-group';
    container.appendChild(resultsList);
    
    // Sayfalama fonksiyonu
    function showPage(page) {
        // Geçerli sayfa numarasını güncelle
        currentPage = page;
        
        // Sayfada gösterilecek sonuçları hesapla
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, validResults.length);
        const pageResults = validResults.slice(startIndex, endIndex);
        
        // Sonuçları temizle
        resultsList.innerHTML = '';
        
        // Sonuçları göster
        pageResults.forEach(company => {
            // E-posta bilgisi yoksa ve website varsa, website'den e-posta oluştur
            if (!company.email && company.website) {
                company.email = extractEmailFromWebsite(company.website);
            }
            
            // Firma verilerini temizle ve düzenle
            const cleanedCompany = cleanCompanyData(company);
            
            const companyItem = document.createElement('div');
            companyItem.className = 'list-group-item border-0 shadow-sm mb-3 p-0';
            companyItem.setAttribute('data-id', cleanedCompany.place_id);
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (cleanedCompany.rating) {
                const fullStars = Math.floor(cleanedCompany.rating);
                const halfStar = cleanedCompany.rating % 1 >= 0.5;
                const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
                
                for (let i = 0; i < fullStars; i++) {
                    starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
                }
                
                if (halfStar) {
                    starsHtml += '<i class="bi bi-star-half text-warning"></i>';
                }
                
                for (let i = 0; i < emptyStars; i++) {
                    starsHtml += '<i class="bi bi-star text-warning"></i>';
                }
                
                starsHtml += `<span class="text-muted ms-1">(${cleanedCompany.user_ratings_total || 0})</span>`;
            }
            
            // Firma türlerini göster
            let typesHtml = '';
            if (cleanedCompany.types && cleanedCompany.types.length > 0) {
                typesHtml = cleanedCompany.types.slice(0, 3).map(type => 
                    `<span class="badge bg-light text-dark me-1">${type.replace(/_/g, ' ')}</span>`
                ).join('');
            }
            
            // Firma kartını oluştur
            companyItem.innerHTML = `
                <div class="card border-0">
                    <div class="card-header bg-white d-flex align-items-center py-3">
                        <div class="form-check me-2">
                            <input class="form-check-input" type="checkbox" value="${cleanedCompany.place_id}" id="check-${cleanedCompany.place_id}">
                            <label class="form-check-label" for="check-${cleanedCompany.place_id}"></label>
                        </div>
                        <h5 class="card-title mb-0 flex-grow-1">${cleanedCompany.name}</h5>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-outline-primary me-2 view-details-btn" data-place-id="${cleanedCompany.place_id}">
                                <i class="bi bi-info-circle me-1"></i> Detaylar
                            </button>
                            <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${cleanedCompany.place_id}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="card-text mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    <strong>Adres:</strong> ${cleanedCompany.formatted_address || cleanedCompany.vicinity || '<span class="text-muted">Adres bilgisi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone text-primary me-2"></i>
                                    <strong>Telefon:</strong> 
                                    ${cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number ? 
                                        `<span class="text-dark">${cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number}</span>
                                        <a href="tel:${(cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number).replace(/\s+/g, '')}" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-telephone"></i> Ara
                                        </a>
                                        <button class="btn btn-sm btn-outline-success ms-1" onclick="sendWhatsAppFromDetails('${formatPhoneForWhatsApp(cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number)}', '${cleanedCompany.name.replace(/'/g, "\\'")}')">
                                            <i class="bi bi-whatsapp"></i> WhatsApp
                                        </button>` : 
                                        '<span class="text-muted">Telefon bilgisi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-globe text-primary me-2"></i>
                                    <strong>Web Sitesi:</strong> 
                                    ${cleanedCompany.website ? 
                                        `<a href="${cleanedCompany.website}" target="_blank" class="text-primary">${cleanedCompany.website}</a>
                                        <a href="${cleanedCompany.website}" target="_blank" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-box-arrow-up-right"></i> Ziyaret Et
                                        </a>` : 
                                        '<span class="text-muted">Web sitesi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-0">
                                    <i class="bi bi-envelope text-primary me-2"></i>
                                    <strong>E-posta:</strong> 
                                    ${cleanedCompany.email ? 
                                        `<a href="mailto:${cleanedCompany.email}" class="text-primary">${cleanedCompany.email}</a>
                                        <a href="mailto:${cleanedCompany.email}" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-envelope"></i> E-posta Gönder
                                        </a>` : 
                                        '<span class="text-muted">E-posta bilgisi bulunamadı</span>'}
                                </p>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex flex-column h-100">
                                    <div class="mb-2">
                                        ${starsHtml}
                                    </div>
                                    <div class="mb-2">
                                        ${typesHtml}
                                    </div>
                                    <div class="mt-auto">
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedCompany.name)}&query_place_id=${encodeURIComponent(cleanedCompany.place_id)}" 
                                           target="_blank" class="btn btn-sm btn-outline-secondary w-100">
                                            <i class="bi bi-map me-1"></i> Haritada Göster
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            resultsList.appendChild(companyItem);
        });
        
        // Sayfalama kontrollerini güncelle
        updatePagination();
        
        // Detay butonlarına olay dinleyicisi ekle
        const detailButtons = resultsList.querySelectorAll('.view-details-btn');
        detailButtons.forEach(button => {
            button.addEventListener('click', function() {
                const placeId = this.getAttribute('data-place-id');
                
                // place_id kontrolü
                if (!placeId) {
                    console.error('Detay butonunda place_id bulunamadı');
                    showNotification('Firma detayları gösterilemiyor: Geçersiz ID', 'danger');
                    return;
                }
                
                // Geçici ID kontrolü
                const company = validResults.find(c => c.place_id === placeId);
                if (company && company._isTemporaryId) {
                    console.warn('Geçici ID ile firma detayları gösteriliyor:', placeId);
                    
                    // Geçici ID'li firmalar için basit bir detay modalı göster
                    showSimpleCompanyDetails(company);
                    return;
                }
                
                console.log('Firma detayları gösteriliyor, placeId:', placeId);
                showCompanyDetails(placeId);
            });
        });
        
        // Kaydet butonlarına olay dinleyicisi ekle
        const saveButtons = resultsList.querySelectorAll('.save-company-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const placeId = this.getAttribute('data-place-id');
                const company = validResults.find(c => c.place_id === placeId);
                
                if (company) {
                    try {
                        // Kullanıcı oturum durumunu kontrol et
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (!user) {
                            showNotification('Firma kaydetmek için lütfen giriş yapın', 'warning');
                            changeView('login');
                            return;
                        }
                        
                        // Firmayı kaydet
                        const result = await saveCompanies([company], user.id);
                        
                        if (result.success) {
                            showNotification('Firma başarıyla kaydedildi', 'success');
                            this.disabled = true;
                            this.innerHTML = '<i class="bi bi-bookmark-check me-1"></i> Kaydedildi';
                        } else {
                            showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
                        }
                    } catch (error) {
                        console.error('Firma kaydetme hatası:', error);
                        showNotification('Firma kaydedilemedi', 'danger');
                    }
                }
            });
        });
    }
    
    // Tümünü Seç butonuna olay dinleyicisi ekle
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const checkboxes = resultsList.querySelectorAll('.form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    // Seçimi Temizle butonuna olay dinleyicisi ekle
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            const checkboxes = resultsList.querySelectorAll('.form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    
    // WhatsApp butonuna olay dinleyicisi ekle
    const sendWhatsAppBtn = document.getElementById('send-whatsapp-btn');
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', handleSendWhatsApp);
    }
    
    // E-posta butonuna olay dinleyicisi ekle
    const sendEmailBtn = document.getElementById('send-email-btn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', handleSendEmail);
    }
    
    // Kaydet butonuna olay dinleyicisi ekle
    const saveResultsBtn = document.getElementById('save-results-btn');
    if (saveResultsBtn) {
        saveResultsBtn.addEventListener('click', handleSaveResults);
    }
    
    // Sayfalama kontrollerini güncelle
    function updatePagination() {
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) {
            return; // Tek sayfa varsa sayfalama gösterme
        }
        
        const pagination = document.createElement('nav');
        pagination.setAttribute('aria-label', 'Sayfalama');
        
        const paginationList = document.createElement('ul');
        paginationList.className = 'pagination justify-content-center';
        
        // Önceki sayfa butonu
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.setAttribute('aria-label', 'Önceki');
        prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
        
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                showPage(currentPage - 1);
            }
        });
        
        prevItem.appendChild(prevLink);
        paginationList.appendChild(prevItem);
        
        // Sayfa numaraları
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // İlk sayfa
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            
            const firstLink = document.createElement('a');
            firstLink.className = 'page-link';
            firstLink.href = '#';
            firstLink.textContent = '1';
            
            firstLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(1);
            });
            
            firstItem.appendChild(firstLink);
            paginationList.appendChild(firstItem);
            
            if (startPage > 2) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                
                const ellipsisLink = document.createElement('a');
                ellipsisLink.className = 'page-link';
                ellipsisLink.href = '#';
                ellipsisLink.textContent = '...';
                
                ellipsisItem.appendChild(ellipsisLink);
                paginationList.appendChild(ellipsisItem);
            }
        }
        
        // Sayfa numaraları
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            
            pageLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(i);
            });
            
            pageItem.appendChild(pageLink);
            paginationList.appendChild(pageItem);
        }
        
        // Son sayfa
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                
                const ellipsisLink = document.createElement('a');
                ellipsisLink.className = 'page-link';
                ellipsisLink.href = '#';
                ellipsisLink.textContent = '...';
                
                ellipsisItem.appendChild(ellipsisLink);
                paginationList.appendChild(ellipsisItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            
            const lastLink = document.createElement('a');
            lastLink.className = 'page-link';
            lastLink.href = '#';
            lastLink.textContent = totalPages;
            
            lastLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(totalPages);
            });
            
            lastItem.appendChild(lastLink);
            paginationList.appendChild(lastItem);
        }
        
        // Sonraki sayfa butonu
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.setAttribute('aria-label', 'Sonraki');
        nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
        
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                showPage(currentPage + 1);
            }
        });
        
        nextItem.appendChild(nextLink);
        paginationList.appendChild(nextItem);
        
        pagination.appendChild(paginationList);
        paginationContainer.appendChild(pagination);
    }
    
    // İlk sayfayı göster
    showPage(1);
    
    // Tüm sonuçları global değişkende sakla
    window.allSearchResults = validResults;
    
    // Toplu işlem butonlarını güncelle
    setTimeout(updateBulkActionButtons, 100);
}

// Arama Sonuçlarını Görüntüle
function displaySearchResults(results, container) {
    // Sonuç yoksa bilgi mesajı göster
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">Arama kriterlerinize uygun sonuç bulunamadı</p>
            </div>
        `;
        return;
    }
    
    // Geçersiz place_id'leri filtrele
    const validResults = results.filter(company => {
        if (!company.place_id) {
            console.warn('Geçersiz firma: place_id yok', company);
            return false;
        }
        
        return true;
    });
    
    if (validResults.length < results.length) {
        console.log(`${results.length - validResults.length} geçersiz sonuç filtrelendi`);
        showNotification(`${validResults.length} geçerli firma bulundu (${results.length - validResults.length} geçersiz sonuç filtrelendi)`, 'info');
    }
    
    // Filtrelenmiş sonuçlar boşsa bilgi mesajı göster
    if (validResults.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Arama sonuçları alındı ancak geçerli firma bulunamadı. Lütfen farklı arama kriterleri deneyin.
            </div>
        `;
        return;
    }
    
    // Sonuçları göster
    container.innerHTML = '';
    
    // Sonuç sayısını göster
    const resultCount = document.createElement('div');
    resultCount.className = 'alert alert-info mb-3';
    resultCount.innerHTML = `
        <i class="bi bi-info-circle me-2"></i>
        <strong>${validResults.length}</strong> firma bulundu
        <div class="mt-2 small">
            <p class="mb-1">Google Places API her sayfada maksimum 20 sonuç gösterir. Daha fazla sonuç için sayfalama kullanılır.</p>
            <p class="mb-0">Toplam sonuç sayısı 100 ile sınırlıdır. Daha spesifik arama kriterleri kullanarak sonuçları daraltabilirsiniz.</p>
        </div>
    `;
    container.appendChild(resultCount);
    
    // Geçici ID'li firmalar için uyarı göster
    const tempIdCount = validResults.filter(company => company._isTemporaryId).length;
    if (tempIdCount > 0) {
        const tempIdWarning = document.createElement('div');
        tempIdWarning.className = 'alert alert-warning mb-3';
        tempIdWarning.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>${tempIdCount}</strong> firma için tam detaylar gösterilemiyor. Bu firmalar için detay görüntüleme sınırlı olabilir.
        `;
        container.appendChild(tempIdWarning);
    }
    
    // Toplu işlem butonları
    const bulkActionsContainer = document.createElement('div');
    bulkActionsContainer.className = 'd-flex justify-content-between align-items-center mb-4 mt-3 p-3 bg-light rounded shadow-sm';
    bulkActionsContainer.innerHTML = `
        <div>
            <button class="btn btn-outline-primary me-2" id="select-all-btn">
                <i class="bi bi-check-all me-1"></i> Tümünü Seç
            </button>
            <button class="btn btn-outline-primary me-2" id="deselect-all-btn">
                <i class="bi bi-x-lg me-1"></i> Seçimi Temizle
            </button>
        </div>
        <div>
            <button class="btn btn-success me-2 whatsapp-btn" id="send-whatsapp-btn">
                <i class="bi bi-whatsapp me-1"></i> WhatsApp
            </button>
            <button class="btn btn-primary me-2 email-btn" id="send-email-btn">
                <i class="bi bi-envelope me-1"></i> E-posta
            </button>
            <button class="btn btn-outline-primary save-btn" id="save-results-btn">
                <i class="bi bi-bookmark me-1"></i> Kaydet
            </button>
        </div>
    `;
    container.appendChild(bulkActionsContainer);
    
    // Üst kısımdaki butonları aktif et
    activateTopButtons();
    
    // Sayfalama için değişkenler
    const itemsPerPage = 10; // Her sayfada gösterilecek sonuç sayısı
    const totalPages = Math.ceil(validResults.length / itemsPerPage);
    let currentPage = 1;
    
    // Sayfalama konteynerini oluştur
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container mb-3';
    container.appendChild(paginationContainer);
    
    // Sonuçları listele
    const resultsList = document.createElement('div');
    resultsList.className = 'list-group';
    container.appendChild(resultsList);
    
    // Sayfalama fonksiyonu
    function showPage(page) {
        // Geçerli sayfa numarasını güncelle
        currentPage = page;
        
        // Sayfada gösterilecek sonuçları hesapla
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, validResults.length);
        const pageResults = validResults.slice(startIndex, endIndex);
        
        // Sonuçları temizle
        resultsList.innerHTML = '';
        
        // Sonuçları göster
        pageResults.forEach(company => {
            // E-posta bilgisi yoksa ve website varsa, website'den e-posta oluştur
            if (!company.email && company.website) {
                company.email = extractEmailFromWebsite(company.website);
            }
            
            // Firma verilerini temizle ve düzenle
            const cleanedCompany = cleanCompanyData(company);
            
            const companyItem = document.createElement('div');
            companyItem.className = 'list-group-item border-0 shadow-sm mb-3 p-0';
            companyItem.setAttribute('data-id', cleanedCompany.place_id);
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (cleanedCompany.rating) {
                const fullStars = Math.floor(cleanedCompany.rating);
                const halfStar = cleanedCompany.rating % 1 >= 0.5;
                const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
                
                for (let i = 0; i < fullStars; i++) {
                    starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
                }
                
                if (halfStar) {
                    starsHtml += '<i class="bi bi-star-half text-warning"></i>';
                }
                
                for (let i = 0; i < emptyStars; i++) {
                    starsHtml += '<i class="bi bi-star text-warning"></i>';
                }
                
                starsHtml += `<span class="text-muted ms-1">(${cleanedCompany.user_ratings_total || 0})</span>`;
            }
            
            // Firma türlerini göster
            let typesHtml = '';
            if (cleanedCompany.types && cleanedCompany.types.length > 0) {
                typesHtml = cleanedCompany.types.slice(0, 3).map(type => 
                    `<span class="badge bg-light text-dark me-1">${type.replace(/_/g, ' ')}</span>`
                ).join('');
            }
            
            // Firma kartını oluştur
            companyItem.innerHTML = `
                <div class="card border-0">
                    <div class="card-header bg-white d-flex align-items-center py-3">
                        <div class="form-check me-2">
                            <input class="form-check-input" type="checkbox" value="${cleanedCompany.place_id}" id="check-${cleanedCompany.place_id}">
                            <label class="form-check-label" for="check-${cleanedCompany.place_id}"></label>
                        </div>
                        <h5 class="card-title mb-0 flex-grow-1">${cleanedCompany.name}</h5>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-outline-primary me-2 view-details-btn" data-place-id="${cleanedCompany.place_id}">
                                <i class="bi bi-info-circle me-1"></i> Detaylar
                            </button>
                            <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${cleanedCompany.place_id}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="card-text mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    <strong>Adres:</strong> ${cleanedCompany.formatted_address || cleanedCompany.vicinity || '<span class="text-muted">Adres bilgisi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone text-primary me-2"></i>
                                    <strong>Telefon:</strong> 
                                    ${cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number ? 
                                        `<span class="text-dark">${cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number}</span>
                                        <a href="tel:${(cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number).replace(/\s+/g, '')}" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-telephone"></i> Ara
                                        </a>
                                        <button class="btn btn-sm btn-outline-success ms-1" onclick="sendWhatsAppFromDetails('${formatPhoneForWhatsApp(cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number)}', '${cleanedCompany.name.replace(/'/g, "\\'")}')">
                                            <i class="bi bi-whatsapp"></i> WhatsApp
                                        </button>` : 
                                        '<span class="text-muted">Telefon bilgisi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-globe text-primary me-2"></i>
                                    <strong>Web Sitesi:</strong> 
                                    ${cleanedCompany.website ? 
                                        `<a href="${cleanedCompany.website}" target="_blank" class="text-primary">${cleanedCompany.website}</a>
                                        <a href="${cleanedCompany.website}" target="_blank" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-box-arrow-up-right"></i> Ziyaret Et
                                        </a>` : 
                                        '<span class="text-muted">Web sitesi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-0">
                                    <i class="bi bi-envelope text-primary me-2"></i>
                                    <strong>E-posta:</strong> 
                                    ${cleanedCompany.email ? 
                                        `<a href="mailto:${cleanedCompany.email}" class="text-primary">${cleanedCompany.email}</a>
                                        <a href="mailto:${cleanedCompany.email}" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-envelope"></i> E-posta Gönder
                                        </a>` : 
                                        '<span class="text-muted">E-posta bilgisi bulunamadı</span>'}
                                </p>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex flex-column h-100">
                                    <div class="mb-2">
                                        ${starsHtml}
                                    </div>
                                    <div class="mb-2">
                                        ${typesHtml}
                                    </div>
                                    <div class="mt-auto">
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedCompany.name)}&query_place_id=${encodeURIComponent(cleanedCompany.place_id)}" 
                                           target="_blank" class="btn btn-sm btn-outline-secondary w-100">
                                            <i class="bi bi-map me-1"></i> Haritada Göster
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            resultsList.appendChild(companyItem);
        });
        
        // Sayfalama kontrollerini güncelle
        updatePagination();
        
        // Detay butonlarına olay dinleyicisi ekle
        const detailButtons = resultsList.querySelectorAll('.view-details-btn');
        detailButtons.forEach(button => {
            button.addEventListener('click', function() {
                const placeId = this.getAttribute('data-place-id');
                
                // place_id kontrolü
                if (!placeId) {
                    console.error('Detay butonunda place_id bulunamadı');
                    showNotification('Firma detayları gösterilemiyor: Geçersiz ID', 'danger');
                    return;
                }
                
                // Geçici ID kontrolü
                const company = validResults.find(c => c.place_id === placeId);
                if (company && company._isTemporaryId) {
                    console.warn('Geçici ID ile firma detayları gösteriliyor:', placeId);
                    
                    // Geçici ID'li firmalar için basit bir detay modalı göster
                    showSimpleCompanyDetails(company);
                    return;
                }
                
                console.log('Firma detayları gösteriliyor, placeId:', placeId);
                showCompanyDetails(placeId);
            });
        });
        
        // Kaydet butonlarına olay dinleyicisi ekle
        const saveButtons = resultsList.querySelectorAll('.save-company-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const placeId = this.getAttribute('data-place-id');
                const company = validResults.find(c => c.place_id === placeId);
                
                if (company) {
                    try {
                        // Kullanıcı oturum durumunu kontrol et
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (!user) {
                            showNotification('Firma kaydetmek için lütfen giriş yapın', 'warning');
                            changeView('login');
                            return;
                        }
                        
                        // Firmayı kaydet
                        const result = await saveCompanies([company], user.id);
                        
                        if (result.success) {
                            showNotification('Firma başarıyla kaydedildi', 'success');
                            this.disabled = true;
                            this.innerHTML = '<i class="bi bi-bookmark-check me-1"></i> Kaydedildi';
                        } else {
                            showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
                        }
                    } catch (error) {
                        console.error('Firma kaydetme hatası:', error);
                        showNotification('Firma kaydedilemedi', 'danger');
                    }
                }
            });
        });
    }
    
    // Tümünü Seç butonuna olay dinleyicisi ekle
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const checkboxes = resultsList.querySelectorAll('.form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    // Seçimi Temizle butonuna olay dinleyicisi ekle
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            const checkboxes = resultsList.querySelectorAll('.form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    
    // WhatsApp butonuna olay dinleyicisi ekle
    const sendWhatsAppBtn = document.getElementById('send-whatsapp-btn');
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', handleSendWhatsApp);
    }
    
    // E-posta butonuna olay dinleyicisi ekle
    const sendEmailBtn = document.getElementById('send-email-btn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', handleSendEmail);
    }
    
    // Kaydet butonuna olay dinleyicisi ekle
    const saveResultsBtn = document.getElementById('save-results-btn');
    if (saveResultsBtn) {
        saveResultsBtn.addEventListener('click', handleSaveResults);
    }
    
    // Sayfalama kontrollerini güncelle
    function updatePagination() {
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) {
            return; // Tek sayfa varsa sayfalama gösterme
        }
        
        const pagination = document.createElement('nav');
        pagination.setAttribute('aria-label', 'Sayfalama');
        
        const paginationList = document.createElement('ul');
        paginationList.className = 'pagination justify-content-center';
        
        // Önceki sayfa butonu
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.setAttribute('aria-label', 'Önceki');
        prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
        
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                showPage(currentPage - 1);
            }
        });
        
        prevItem.appendChild(prevLink);
        paginationList.appendChild(prevItem);
        
        // Sayfa numaraları
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // İlk sayfa
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            
            const firstLink = document.createElement('a');
            firstLink.className = 'page-link';
            firstLink.href = '#';
            firstLink.textContent = '1';
            
            firstLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(1);
            });
            
            firstItem.appendChild(firstLink);
            paginationList.appendChild(firstItem);
            
            if (startPage > 2) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                
                const ellipsisLink = document.createElement('a');
                ellipsisLink.className = 'page-link';
                ellipsisLink.href = '#';
                ellipsisLink.textContent = '...';
                
                ellipsisItem.appendChild(ellipsisLink);
                paginationList.appendChild(ellipsisItem);
            }
        }
        
        // Sayfa numaraları
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            
            pageLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(i);
            });
            
            pageItem.appendChild(pageLink);
            paginationList.appendChild(pageItem);
        }
        
        // Son sayfa
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                
                const ellipsisLink = document.createElement('a');
                ellipsisLink.className = 'page-link';
                ellipsisLink.href = '#';
                ellipsisLink.textContent = '...';
                
                ellipsisItem.appendChild(ellipsisLink);
                paginationList.appendChild(ellipsisItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            
            const lastLink = document.createElement('a');
            lastLink.className = 'page-link';
            lastLink.href = '#';
            lastLink.textContent = totalPages;
            
            lastLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(totalPages);
            });
            
            lastItem.appendChild(lastLink);
            paginationList.appendChild(lastItem);
        }
        
        // Sonraki sayfa butonu
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.setAttribute('aria-label', 'Sonraki');
        nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
        
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                showPage(currentPage + 1);
            }
        });
        
        nextItem.appendChild(nextLink);
        paginationList.appendChild(nextItem);
        
        pagination.appendChild(paginationList);
        paginationContainer.appendChild(pagination);
    }
    
    // İlk sayfayı göster
    showPage(1);
    
    // Tüm sonuçları global değişkende sakla
    window.allSearchResults = validResults;
    
    // Toplu işlem butonlarını güncelle
    setTimeout(updateBulkActionButtons, 100);
}

// Arama Sonuçlarını Görüntüle
function displaySearchResults(results, container) {
    // Sonuç yoksa bilgi mesajı göster
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">Arama kriterlerinize uygun sonuç bulunamadı</p>
            </div>
        `;
        return;
    }
    
    // Geçersiz place_id'leri filtrele
    const validResults = results.filter(company => {
        if (!company.place_id) {
            console.warn('Geçersiz firma: place_id yok', company);
            return false;
        }
        
        return true;
    });
    
    if (validResults.length < results.length) {
        console.log(`${results.length - validResults.length} geçersiz sonuç filtrelendi`);
        showNotification(`${validResults.length} geçerli firma bulundu (${results.length - validResults.length} geçersiz sonuç filtrelendi)`, 'info');
    }
    
    // Filtrelenmiş sonuçlar boşsa bilgi mesajı göster
    if (validResults.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Arama sonuçları alındı ancak geçerli firma bulunamadı. Lütfen farklı arama kriterleri deneyin.
            </div>
        `;
        return;
    }
    
    // Sonuçları göster
    container.innerHTML = '';
    
    // Sonuç sayısını göster
    const resultCount = document.createElement('div');
    resultCount.className = 'alert alert-info mb-3';
    resultCount.innerHTML = `
        <i class="bi bi-info-circle me-2"></i>
        <strong>${validResults.length}</strong> firma bulundu
        <div class="mt-2 small">
            <p class="mb-1">Google Places API her sayfada maksimum 20 sonuç gösterir. Daha fazla sonuç için sayfalama kullanılır.</p>
            <p class="mb-0">Toplam sonuç sayısı 100 ile sınırlıdır. Daha spesifik arama kriterleri kullanarak sonuçları daraltabilirsiniz.</p>
        </div>
    `;
    container.appendChild(resultCount);
    
    // Geçici ID'li firmalar için uyarı göster
    const tempIdCount = validResults.filter(company => company._isTemporaryId).length;
    if (tempIdCount > 0) {
        const tempIdWarning = document.createElement('div');
        tempIdWarning.className = 'alert alert-warning mb-3';
        tempIdWarning.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>${tempIdCount}</strong> firma için tam detaylar gösterilemiyor. Bu firmalar için detay görüntüleme sınırlı olabilir.
        `;
        container.appendChild(tempIdWarning);
    }
    
    // Toplu işlem butonları
    const bulkActionsContainer = document.createElement('div');
    bulkActionsContainer.className = 'd-flex justify-content-between align-items-center mb-4 mt-3 p-3 bg-light rounded shadow-sm';
    bulkActionsContainer.innerHTML = `
        <div>
            <button class="btn btn-outline-primary me-2" id="select-all-btn">
                <i class="bi bi-check-all me-1"></i> Tümünü Seç
            </button>
            <button class="btn btn-outline-primary me-2" id="deselect-all-btn">
                <i class="bi bi-x-lg me-1"></i> Seçimi Temizle
            </button>
        </div>
        <div>
            <button class="btn btn-success me-2 whatsapp-btn" id="send-whatsapp-btn">
                <i class="bi bi-whatsapp me-1"></i> WhatsApp
            </button>
            <button class="btn btn-primary me-2 email-btn" id="send-email-btn">
                <i class="bi bi-envelope me-1"></i> E-posta
            </button>
            <button class="btn btn-outline-primary save-btn" id="save-results-btn">
                <i class="bi bi-bookmark me-1"></i> Kaydet
            </button>
        </div>
    `;
    container.appendChild(bulkActionsContainer);
    
    // Üst kısımdaki butonları aktif et
    activateTopButtons();
    
    // Sayfalama için değişkenler
    const itemsPerPage = 10; // Her sayfada gösterilecek sonuç sayısı
    const totalPages = Math.ceil(validResults.length / itemsPerPage);
    let currentPage = 1;
    
    // Sayfalama konteynerini oluştur
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container mb-3';
    container.appendChild(paginationContainer);
    
    // Sonuçları listele
    const resultsList = document.createElement('div');
    resultsList.className = 'list-group';
    container.appendChild(resultsList);
    
    // Sayfalama fonksiyonu
    function showPage(page) {
        // Geçerli sayfa numarasını güncelle
        currentPage = page;
        
        // Sayfada gösterilecek sonuçları hesapla
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, validResults.length);
        const pageResults = validResults.slice(startIndex, endIndex);
        
        // Sonuçları temizle
        resultsList.innerHTML = '';
        
        // Sonuçları göster
        pageResults.forEach(company => {
            // E-posta bilgisi yoksa ve website varsa, website'den e-posta oluştur
            if (!company.email && company.website) {
                company.email = extractEmailFromWebsite(company.website);
            }
            
            // Firma verilerini temizle ve düzenle
            const cleanedCompany = cleanCompanyData(company);
            
            const companyItem = document.createElement('div');
            companyItem.className = 'list-group-item border-0 shadow-sm mb-3 p-0';
            companyItem.setAttribute('data-id', cleanedCompany.place_id);
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (cleanedCompany.rating) {
                const fullStars = Math.floor(cleanedCompany.rating);
                const halfStar = cleanedCompany.rating % 1 >= 0.5;
                const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
                
                for (let i = 0; i < fullStars; i++) {
                    starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
                }
                
                if (halfStar) {
                    starsHtml += '<i class="bi bi-star-half text-warning"></i>';
                }
                
                for (let i = 0; i < emptyStars; i++) {
                    starsHtml += '<i class="bi bi-star text-warning"></i>';
                }
                
                starsHtml += `<span class="text-muted ms-1">(${cleanedCompany.user_ratings_total || 0})</span>`;
            }
            
            // Firma türlerini göster
            let typesHtml = '';
            if (cleanedCompany.types && cleanedCompany.types.length > 0) {
                typesHtml = cleanedCompany.types.slice(0, 3).map(type => 
                    `<span class="badge bg-light text-dark me-1">${type.replace(/_/g, ' ')}</span>`
                ).join('');
            }
            
            // Firma kartını oluştur
            companyItem.innerHTML = `
                <div class="card border-0">
                    <div class="card-header bg-white d-flex align-items-center py-3">
                        <div class="form-check me-2">
                            <input class="form-check-input" type="checkbox" value="${cleanedCompany.place_id}" id="check-${cleanedCompany.place_id}">
                            <label class="form-check-label" for="check-${cleanedCompany.place_id}"></label>
                        </div>
                        <h5 class="card-title mb-0 flex-grow-1">${cleanedCompany.name}</h5>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-outline-primary me-2 view-details-btn" data-place-id="${cleanedCompany.place_id}">
                                <i class="bi bi-info-circle me-1"></i> Detaylar
                            </button>
                            <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${cleanedCompany.place_id}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="card-text mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    <strong>Adres:</strong> ${cleanedCompany.formatted_address || cleanedCompany.vicinity || '<span class="text-muted">Adres bilgisi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone text-primary me-2"></i>
                                    <strong>Telefon:</strong> 
                                    ${cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number ? 
                                        `<span class="text-dark">${cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number}</span>
                                        <a href="tel:${(cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number).replace(/\s+/g, '')}" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-telephone"></i> Ara
                                        </a>
                                        <button class="btn btn-sm btn-outline-success ms-1" onclick="sendWhatsAppFromDetails('${formatPhoneForWhatsApp(cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number)}', '${cleanedCompany.name.replace(/'/g, "\\'")}')">
                                            <i class="bi bi-whatsapp"></i> WhatsApp
                                        </button>` : 
                                        '<span class="text-muted">Telefon bilgisi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-globe text-primary me-2"></i>
                                    <strong>Web Sitesi:</strong> 
                                    ${cleanedCompany.website ? 
                                        `<a href="${cleanedCompany.website}" target="_blank" class="text-primary">${cleanedCompany.website}</a>
                                        <a href="${cleanedCompany.website}" target="_blank" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-box-arrow-up-right"></i> Ziyaret Et
                                        </a>` : 
                                        '<span class="text-muted">Web sitesi bulunamadı</span>'}
                                </p>
                                <p class="card-text mb-0">
                                    <i class="bi bi-envelope text-primary me-2"></i>
                                    <strong>E-posta:</strong> 
                                    ${cleanedCompany.email ? 
                                        `<a href="mailto:${cleanedCompany.email}" class="text-primary">${cleanedCompany.email}</a>
                                        <a href="mailto:${cleanedCompany.email}" class="btn btn-sm btn-outline-primary ms-2">
                                            <i class="bi bi-envelope"></i> E-posta Gönder
                                        </a>` : 
                                        '<span class="text-muted">E-posta bilgisi bulunamadı</span>'}
                                </p>
                            </div>
                            <div class="col-md-4">
                                <div class="d-flex flex-column h-100">
                                    <div class="mb-2">
                                        ${starsHtml}
                                    </div>
                                    <div class="mb-2">
                                        ${typesHtml}
                                    </div>
                                    <div class="mt-auto">
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedCompany.name)}&query_place_id=${encodeURIComponent(cleanedCompany.place_id)}" 
                                           target="_blank" class="btn btn-sm btn-outline-secondary w-100">
                                            <i class="bi bi-map me-1"></i> Haritada Göster
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            resultsList.appendChild(companyItem);
        });
        
        // Sayfalama kontrollerini güncelle
        updatePagination();
        
        // Detay butonlarına olay dinleyicisi ekle
        const detailButtons = resultsList.querySelectorAll('.view-details-btn');
        detailButtons.forEach(button => {
            button.addEventListener('click', function() {
                const placeId = this.getAttribute('data-place-id');
                
                // place_id kontrolü
                if (!placeId) {
                    console.error('Detay butonunda place_id bulunamadı');
                    showNotification('Firma detayları gösterilemiyor: Geçersiz ID', 'danger');
                    return;
                }
                
                // Geçici ID kontrolü
                const company = validResults.find(c => c.place_id === placeId);
                if (company && company._isTemporaryId) {
                    console.warn('Geçici ID ile firma detayları gösteriliyor:', placeId);
                    
                    // Geçici ID'li firmalar için basit bir detay modalı göster
                    showSimpleCompanyDetails(company);
                    return;
                }
                
                console.log('Firma detayları gösteriliyor, placeId:', placeId);
                showCompanyDetails(placeId);
            });
        });
        
        // Kaydet butonlarına olay dinleyicisi ekle
        const saveButtons = resultsList.querySelectorAll('.save-company-btn');
        saveButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const placeId = this.getAttribute('data-place-id');
                const company = validResults.find(c => c.place_id === placeId);
                
                if (company) {
                    try {
                        // Kullanıcı oturum durumunu kontrol et
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (!user) {
                            showNotification('Firma kaydetmek için lütfen giriş yapın', 'warning');
                            changeView('login');
                            return;
                        }
                        
                        // Firmayı kaydet
                        const result = await saveCompanies([company], user.id);
                        
                        if (result.success) {
                            showNotification('Firma başarıyla kaydedildi', 'success');
                            this.disabled = true;
                            this.innerHTML = '<i class="bi bi-bookmark-check me-1"></i> Kaydedildi';
                        } else {
                            showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
                        }
                    } catch (error) {
                        console.error('Firma kaydetme hatası:', error);
                        showNotification('Firma kaydedilemedi', 'danger');
                    }
                }
            });
        });
    }
    
    // Tümünü Seç butonuna olay dinleyicisi ekle
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const checkboxes = resultsList.querySelectorAll('.form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    // Seçimi Temizle butonuna olay dinleyicisi ekle
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            const checkboxes = resultsList.querySelectorAll('.form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    }
    
    // WhatsApp butonuna olay dinleyicisi ekle
    const sendWhatsAppBtn = document.getElementById('send-whatsapp-btn');
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', handleSendWhatsApp);
    }
    
    // E-posta butonuna olay dinleyicisi ekle
    const sendEmailBtn = document.getElementById('send-email-btn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', handleSendEmail);
    }
    
    // Kaydet butonuna olay dinleyicisi ekle
    const saveResultsBtn = document.getElementById('save-results-btn');
    if (saveResultsBtn) {
        saveResultsBtn.addEventListener('click', handleSaveResults);
    }
    
    // Sayfalama kontrollerini güncelle
    function updatePagination() {
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) {
            return; // Tek sayfa varsa sayfalama gösterme
        }
        
        const pagination = document.createElement('nav');
        pagination.setAttribute('aria-label', 'Sayfalama');
        
        const paginationList = document.createElement('ul');
        paginationList.className = 'pagination justify-content-center';
        
        // Önceki sayfa butonu
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.setAttribute('aria-label', 'Önceki');
        prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
        
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                showPage(currentPage - 1);
            }
        });
        
        prevItem.appendChild(prevLink);
        paginationList.appendChild(prevItem);
        
        // Sayfa numaraları
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // İlk sayfa
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            
            const firstLink = document.createElement('a');
            firstLink.className = 'page-link';
            firstLink.href = '#';
            firstLink.textContent = '1';
            
            firstLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(1);
            });
            
            firstItem.appendChild(firstLink);
            paginationList.appendChild(firstItem);
            
            if (startPage > 2) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                
                const ellipsisLink = document.createElement('a');
                ellipsisLink.className = 'page-link';
                ellipsisLink.href = '#';
                ellipsisLink.textContent = '...';
                
                ellipsisItem.appendChild(ellipsisLink);
                paginationList.appendChild(ellipsisItem);
            }
        }
        
        // Sayfa numaraları
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            
            pageLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(i);
            });
            
            pageItem.appendChild(pageLink);
            paginationList.appendChild(pageItem);
        }
        
        // Son sayfa
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                
                const ellipsisLink = document.createElement('a');
                ellipsisLink.className = 'page-link';
                ellipsisLink.href = '#';
                ellipsisLink.textContent = '...';
                
                ellipsisItem.appendChild(ellipsisLink);
                paginationList.appendChild(ellipsisItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            
            const lastLink = document.createElement('a');
            lastLink.className = 'page-link';
            lastLink.href = '#';
            lastLink.textContent = totalPages;
            
            lastLink.addEventListener('click', function(e) {
                e.preventDefault();
                showPage(totalPages);
            });
            
            lastItem.appendChild(lastLink);
            paginationList.appendChild(lastItem);
        }
        
        // Sonraki sayfa butonu
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.setAttribute('aria-label', 'Sonraki');
        nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
        
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                showPage(currentPage + 1);
            }
        });
        
        nextItem.appendChild(nextLink);
        paginationList.appendChild(nextItem);
        
        pagination.appendChild(paginationList);
        paginationContainer.appendChild(pagination);
    }
    
    // İlk sayfayı göster
    showPage(1);
    
    // Tüm sonuçları global değişkende sakla
    window.allSearchResults = validResults;
    
    // Toplu işlem butonlarını güncelle
    setTimeout(updateBulkActionButtons, 100);
}

// Aramayı Kaydet
async function saveSearch(query, location, resultCount) {
    try {
        // Kullanıcı oturum açmışsa aramayı kaydet
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('searches')
                .insert([
                    {
                        user_id: user.id,
                        query: query,
                        location: location,
                        result_count: resultCount,
                        created_at: new Date()
                    }
                ]);
                
            if (error) {
                console.error('Arama kaydedilemedi:', error);
            } else {
                console.log('Arama kaydedildi');
            }
        }
    } catch (error) {
        console.error('Arama kaydedilirken bir hata oluştu:', error);
    }
}

// E-posta Gönderme İşlemi
function handleSendEmail() {
    // Form verilerini al
    const subject = document.getElementById('email-subject').value;
    const content = document.getElementById('email-content').value;
    
    // Form doğrulama
    if (!subject || !content) {
        showNotification('Lütfen e-posta konusu ve içeriğini girin', 'danger');
        return;
    }
    
    // Seçili firmaları al
    const selectedCompanies = getSelectedCompanies();
    
    if (selectedCompanies.length === 0) {
        showNotification('Lütfen en az bir firma seçin', 'danger');
        return;
    }
    
    // E-posta gönderme işlemi (API entegrasyonu daha sonra eklenecek)
    showNotification(`${selectedCompanies.length} firmaya e-posta gönderiliyor...`);
    
    // Modal'ı kapat
    const emailModal = bootstrap.Modal.getInstance(document.getElementById('emailModal'));
    emailModal.hide();
    
    // Gerçek e-posta gönderme işlevi daha sonra eklenecek
    setTimeout(() => {
        showNotification(`${selectedCompanies.length} firmaya e-posta başarıyla gönderildi`);
    }, 2000);
}

// Seçili Firmaları Al
function getSelectedCompanies(containerId = 'search-results') {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.form-check-input:checked');
    if (checkboxes.length === 0) {
        console.log('Hiç firma seçilmemiş');
        return [];
    }
    
    console.log(`${checkboxes.length} firma seçilmiş`);
    
    const selectedCompanies = [];
    const allResults = window.allSearchResults || [];
    
    checkboxes.forEach(checkbox => {
        const placeId = checkbox.value;
        console.log('Seçilen firma ID:', placeId);
        
        // Önce global sonuçlar arasında ara
        if (allResults.length > 0) {
            const company = allResults.find(c => c.place_id === placeId);
            if (company) {
                console.log('Firma global sonuçlarda bulundu:', company.name);
                selectedCompanies.push(company);
                return;
            }
        }
        
        // Global sonuçlarda bulunamazsa DOM'dan bilgileri çıkar
        const companyItem = checkbox.closest('.list-group-item');
        if (companyItem) {
            const nameElement = companyItem.querySelector('.card-title');
            const phoneElement = companyItem.querySelector('.bi-telephone')?.closest('p');
            const addressElement = companyItem.querySelector('.bi-geo-alt')?.closest('p');
            const websiteElement = companyItem.querySelector('.bi-globe')?.closest('p');
            const emailElement = companyItem.querySelector('.bi-envelope')?.closest('p');
            
            if (nameElement) {
                const name = nameElement.textContent.trim();
                
                // Telefon bilgisini çıkar
                let phone = '';
                if (phoneElement) {
                    const phoneText = phoneElement.textContent.trim();
                    if (!phoneText.includes('Telefon bilgisi bulunamadı')) {
                        // Telefon: kısmını kaldır
                        phone = phoneText.replace(/Telefon:/, '').trim();
                        // Ara ve WhatsApp butonlarının metinlerini kaldır
                        phone = phone.replace(/Ara/, '').replace(/WhatsApp/, '').trim();
                    }
                }
                
                // Adres bilgisini çıkar
                let address = '';
                if (addressElement) {
                    const addressText = addressElement.textContent.trim();
                    if (!addressText.includes('Adres bilgisi bulunamadı')) {
                        address = addressText.replace(/Adres:/, '').trim();
                    }
                }
                
                // Web sitesi bilgisini çıkar
                let website = '';
                if (websiteElement) {
                    const websiteText = websiteElement.textContent.trim();
                    if (!websiteText.includes('Web sitesi bulunamadı')) {
                        website = websiteText.replace(/Web Sitesi:/, '').replace(/Ziyaret Et/, '').trim();
                    }
                }
                
                // E-posta bilgisini çıkar
                let email = '';
                if (emailElement) {
                    const emailText = emailElement.textContent.trim();
                    if (!emailText.includes('E-posta bilgisi bulunamadı')) {
                        email = emailText.replace(/E-posta:/, '').replace(/E-posta Gönder/, '').trim();
                    }
                }
                
                console.log('DOM\'dan çıkarılan firma bilgileri:', name, phone, address, website, email);
                
                selectedCompanies.push({
                    place_id: placeId,
                    name: name,
                    phone: phone,
                    formatted_address: address,
                    website: website,
                    email: email
                });
            }
        }
    });
    
    console.log('Toplam seçilen firma sayısı:', selectedCompanies.length);
    return selectedCompanies;
}

// WhatsApp Mesajı Gönderme İşlemi
function handleSendWhatsApp() {
    // Seçili firmaları al
    const selectedCompanies = getSelectedCompanies();
    
    // Firma seçilmemişse uyarı göster
    if (selectedCompanies.length === 0) {
        showNotification('Lütfen WhatsApp mesajı göndermek için en az bir firma seçin', 'danger');
        return;
    }
    
    // WhatsApp modalını oluştur veya göster
    const whatsappModal = document.getElementById('whatsappModal');
    if (!whatsappModal) {
        createWhatsAppModal();
    } else {
        const bsWhatsappModal = new bootstrap.Modal(whatsappModal);
        bsWhatsappModal.show();
    }
    
    // Alıcıları güncelle
    updateWhatsAppRecipients(selectedCompanies);
}

// Firma detaylarından WhatsApp mesajı gönderme
function sendWhatsAppFromDetails(phone, companyName) {
    if (!phone) {
        showNotification('Bu firma için telefon numarası bulunamadı', 'danger');
        return;
    }
    
    // Telefon numarasını WhatsApp formatına dönüştür
    const formattedPhone = formatPhoneForWhatsApp(phone);
    
    // Varsayılan mesaj
    const defaultMessage = `Merhaba ${companyName}, `;
    
    // WhatsApp URL'sini oluştur
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMessage)}`;
    
    // Yeni sekmede aç
    window.open(whatsappUrl, '_blank');
}

// WhatsApp Mesajı Gönderme
async function sendWhatsAppMessage(companies, message) {
    if (!companies || companies.length === 0) {
        showNotification('Gönderilecek firma bulunamadı', 'warning');
        return;
    }
    
    console.log('WhatsApp mesajı gönderiliyor:', companies.length, 'firmaya');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const company of companies) {
        try {
            if (!company.phone) {
                console.warn('Telefon numarası olmayan firma:', company.name);
                errorCount++;
                continue;
            }
            
            // Telefon numarasını formatla
            const formattedPhone = formatPhoneForWhatsApp(company.phone);
            if (!formattedPhone) {
                console.warn('Geçersiz telefon numarası:', company.phone);
                errorCount++;
                continue;
            }
            
            // Mesajı kişiselleştir
            const personalizedMessage = message
                .replace(/{firma_adi}/g, company.name)
                .replace(/{tarih}/g, new Date().toLocaleDateString('tr-TR'));
            
            // WhatsApp URL'sini oluştur
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`;
            
            // Yeni sekmede aç
            window.open(whatsappUrl, '_blank');
            successCount++;
            
            // Sonraki firma için bekle
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('WhatsApp mesajı gönderilirken hata:', error);
            errorCount++;
        }
    }
    
    // Sonucu bildir
    if (successCount > 0) {
        showNotification(`${successCount} firmaya WhatsApp mesajı gönderildi${errorCount > 0 ? `, ${errorCount} firma için hata oluştu` : ''}`, 'success');
    } else {
        showNotification('WhatsApp mesajları gönderilemedi', 'danger');
    }
}

// Telefon numarasını WhatsApp için formatla
function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    
    // Tüm boşlukları, parantezleri, tire ve artı işaretlerini kaldır
    let cleaned = phone.replace(/[\s\(\)\-\+]/g, '');
    
    // Eğer numara 0 ile başlıyorsa, 0'ı kaldır
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Türkiye numarası ise ve 90 ile başlamıyorsa, 90 ekle
    if (cleaned.length === 10 && !cleaned.startsWith('90')) {
        cleaned = '90' + cleaned;
    }
    
    // Eğer numara hala 90 ile başlamıyorsa ve 10-11 haneli ise, 90 ekle
    if (!cleaned.startsWith('90') && (cleaned.length === 10 || cleaned.length === 11)) {
        cleaned = '90' + cleaned;
    }
    
    return cleaned;
}

// WhatsApp Modalını Oluştur
function createWhatsAppModal() {
    // Mevcut modalı kontrol et
    let whatsappModal = document.getElementById('whatsappModal');
    
    // Modal yoksa oluştur
    if (!whatsappModal) {
        whatsappModal = document.createElement('div');
        whatsappModal.className = 'modal fade';
        whatsappModal.id = 'whatsappModal';
        whatsappModal.tabIndex = '-1';
        whatsappModal.setAttribute('aria-labelledby', 'whatsappModalLabel');
        whatsappModal.setAttribute('aria-hidden', 'true');
        
        whatsappModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="whatsappModalLabel">
                            <i class="bi bi-whatsapp text-success me-2"></i>
                            WhatsApp Mesajı Gönder
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>
                    <div class="modal-body">
                        <form id="whatsapp-form">
                            <div class="mb-3">
                                <label class="form-label">Mesaj</label>
                                <div id="whatsapp-message" style="height: 200px;"></div>
                                <div class="form-text mt-2">
                                    <p>Değişkenler:</p>
                                    <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="insertWhatsAppVariable('{firma_adi}')">{firma_adi}</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="insertWhatsAppVariable('{adres}')">{adres}</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="insertWhatsAppVariable('{telefon}')">{telefon}</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="insertWhatsAppVariable('{website}')">{website}</button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Alıcılar</label>
                                <div id="whatsapp-recipients" class="border p-2 rounded" style="max-height: 150px; overflow-y: auto;">
                                    <p class="text-muted">Henüz firma seçilmedi</p>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-success send-whatsapp-btn">
                            <i class="bi bi-whatsapp me-1"></i> Gönder
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(whatsappModal);
        
        // WhatsApp Quill editörünü başlat
        const whatsappQuill = new Quill('#whatsapp-message', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                ]
            },
            placeholder: 'WhatsApp mesajınızı buraya yazın...'
        });
        
        // Varsayılan mesaj
        whatsappQuill.setText('Merhaba {firma_adi}, ');
        
        // Gönder butonuna tıklandığında
        const sendButton = whatsappModal.querySelector('.send-whatsapp-btn');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                const messageText = whatsappQuill.getText().trim();
                if (!messageText) {
                    showNotification('Lütfen bir mesaj yazın', 'warning');
                    return;
                }
                
                const selectedCompanies = getSelectedCompanies();
                if (selectedCompanies.length === 0) {
                    showNotification('Lütfen en az bir firma seçin', 'danger');
                    return;
                }
                
                sendWhatsAppMessage(selectedCompanies, messageText);
                bootstrap.Modal.getInstance(whatsappModal).hide();
            });
        }
    }
    
    // Modalı göster
    const bsWhatsappModal = new bootstrap.Modal(whatsappModal);
    bsWhatsappModal.show();
    
    return whatsappModal;
}

// WhatsApp Alıcılarını Güncelle
function updateWhatsAppRecipients(selectedCompanyIds) {
    const recipientsContainer = document.getElementById('whatsapp-recipients');
    if (!recipientsContainer) return;
    
    // Seçili firmaları bul
    const companies = [];
    selectedCompanyIds.forEach(id => {
        const companyElement = document.querySelector(`.company-item[data-id="${id}"]`);
        if (companyElement) {
            const companyName = companyElement.querySelector('.company-name').textContent;
            companies.push({ id, name: companyName });
        }
    });
    
    // Alıcıları göster
    if (companies.length === 0) {
        recipientsContainer.innerHTML = '<p class="text-muted">Henüz firma seçilmedi</p>';
        return;
    }
    
    recipientsContainer.innerHTML = '';
    companies.forEach(company => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-success me-2 mb-2';
        badge.textContent = company.name;
        recipientsContainer.appendChild(badge);
    });
}

// WhatsApp Değişkeni Ekle
function insertWhatsAppVariable(variable) {
    const whatsappQuill = Quill.find(document.getElementById('whatsapp-message'));
    if (whatsappQuill) {
        const range = whatsappQuill.getSelection();
        if (range) {
            whatsappQuill.insertText(range.index, variable);
        } else {
            whatsappQuill.insertText(whatsappQuill.getLength(), variable);
        }
    }
}

// WhatsApp Mesajı Gönder
async function sendWhatsAppMessage(companyIds, message) {
    try {
        // Seçili firmaları kontrol et
        if (!companyIds || companyIds.length === 0) {
            showNotification('Lütfen en az bir firma seçin', 'danger');
            return;
        }
        
        // Mesajı kontrol et
        if (!message || message.trim() === '') {
            showNotification('Lütfen bir mesaj yazın', 'warning');
            return;
        }
        
        // Firmaları bul
        const companies = [];
        companyIds.forEach(id => {
            const companyElement = document.querySelector(`.company-item[data-id="${id}"]`);
            if (companyElement) {
                const companyName = companyElement.querySelector('.company-name').textContent;
                const companyPhone = companyElement.querySelector('.company-contact span:first-child').textContent.replace('Belirtilmemiş', '').trim();
                const companyAddress = companyElement.querySelector('.company-address').textContent;
                const companyWebsite = companyElement.querySelector('.company-contact a') ? 
                    companyElement.querySelector('.company-contact a').href : '';
                
                companies.push({
                    id,
                    name: companyName,
                    phone: companyPhone,
                    address: companyAddress,
                    website: companyWebsite
                });
            }
        });
        
        // Telefon numarası olmayan firmaları filtrele
        const validCompanies = companies.filter(company => company.phone && company.phone !== '');
        
        if (validCompanies.length === 0) {
            showNotification('Seçilen firmaların hiçbirinde telefon numarası bulunamadı', 'danger');
            return;
        }
        
        // Telefon numarası olmayan firma sayısı
        const invalidCount = companies.length - validCompanies.length;
        if (invalidCount > 0) {
            showNotification(`${invalidCount} firmada telefon numarası bulunamadı ve atlandı`, 'warning');
        }
        
        // WhatsApp mesajlarını aç
        validCompanies.forEach(company => {
            // Değişkenleri değiştir
            let personalizedMessage = message
                .replace(/{firma_adi}/g, company.name)
                .replace(/{adres}/g, company.address)
                .replace(/{telefon}/g, company.phone)
                .replace(/{website}/g, company.website);
            
            // Telefon numarasını formatla
            const formattedPhone = formatPhoneForWhatsApp(company.phone);
            
            // WhatsApp URL'sini oluştur
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(personalizedMessage)}`;
            
            // Yeni sekmede aç
            window.open(whatsappUrl, '_blank');
        });
        
        showNotification(`${validCompanies.length} firmaya WhatsApp mesajı gönderildi`, 'success');
    } catch (error) {
        console.error('WhatsApp mesajı gönderme hatası:', error);
        showNotification('WhatsApp mesajı gönderilirken bir hata oluştu: ' + error.message, 'danger');
    }
}

// Sonuçları Kaydetme İşlemi
async function handleSaveResults() {
    // Seçili firmaları al
    const selectedCompanyIds = getSelectedCompanies('search-results');
    
    if (selectedCompanyIds.length === 0) {
        showNotification('Lütfen kaydetmek için en az bir firma seçin', 'danger');
        return;
    }
    
    try {
        // Kullanıcı oturum açmışsa firmaları kaydet
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Seçili firmaların tam bilgilerini al
            const selectedCompanies = [];
            const allResults = window.allSearchResults || [];
            
            selectedCompanyIds.forEach(id => {
                const company = allResults.find(c => c.place_id === id);
                if (company) {
                    selectedCompanies.push({
                        place_id: company.place_id,
                        name: company.name,
                        address: company.formatted_address,
                        rating: company.rating,
                        user_ratings_total: company.user_ratings_total,
                        website: company.website,
                        phone: company.phone,
                        user_id: user.id
                    });
                }
            });
            
            if (selectedCompanies.length === 0) {
                showNotification('Seçilen firmaların bilgileri bulunamadı', 'danger');
                return;
            }
            
            // Kaydetme işlemi
            showNotification(`${selectedCompanies.length} firma kaydediliyor...`);
            
            // Firmaları veritabanına kaydet
            const result = await saveCompanies(selectedCompanies, user.id);
            
            if (result.success) {
                showNotification(`${result.savedCount} firma başarıyla kaydedildi`);
                
                // Kaydedilen firmaları yeniden yükle
                loadSavedCompanies(user);
                loadDashboardSavedCompanies(user);
            } else {
                showNotification('Firmalar kaydedilirken bir hata oluştu: ' + result.error, 'danger');
            }
        } else {
            // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
            showNotification('Firmaları kaydetmek için lütfen giriş yapın', 'warning');
            changeView('login');
        }
    } catch (error) {
        console.error('Firmaları kaydetmek için bir hata oluştu:', error);
        showNotification('Firmalar kaydedilirken bir hata oluştu: ' + error.message, 'danger');
    }
}

// Kullanıcı Verilerini Yükle
function loadUserData(user) {
    // Son aramaları yükle
    loadRecentSearches(user);
    
    // Kaydedilen firmaları yükle
    loadSavedCompanies(user);
    
    // Ana sayfadaki kaydedilen firmaları yükle
    loadDashboardSavedCompanies(user);
}

// Ana Sayfadaki Kaydedilen Firmaları Yükle
async function loadDashboardSavedCompanies(user) {
    const dashboardSavedCompaniesContainer = document.getElementById('dashboard-saved-companies');
    
    if (!dashboardSavedCompaniesContainer) return;
    
    // Yükleme göstergesini göster
    dashboardSavedCompaniesContainer.innerHTML = '<div class="text-center"><div class="loading-spinner mx-auto"></div></div>';
    
    try {
        // Kaydedilen firmaları veritabanından çek
        const { data: companies, error } = await supabase
            .from('saved_companies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
            
        if (error) {
            console.error('Kaydedilen firmalar yüklenemedi:', error);
            dashboardSavedCompaniesContainer.innerHTML = '<div class="text-center py-4"><p class="text-muted mb-0">Kaydedilen firmalar yüklenirken bir hata oluştu</p></div>';
            return;
        }
        
        if (companies.length === 0) {
            dashboardSavedCompaniesContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-bookmark text-muted mb-2" style="font-size: 2rem;"></i>
                    <p class="text-muted mb-0">Henüz kaydedilmiş firma bulunmuyor</p>
                </div>
            `;
            return;
        }
        
        // Firmaları listele
        dashboardSavedCompaniesContainer.innerHTML = '';
        companies.forEach(company => {
            // Yıldız değerlendirmesi oluştur
            const rating = company.rating || 0;
            const fullStars = Math.floor(rating);
            const halfStar = rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
            
            let starsHtml = '';
            for (let i = 0; i < fullStars; i++) starsHtml += '<i class="bi bi-star-fill"></i> ';
            if (halfStar) starsHtml += '<i class="bi bi-star-half"></i> ';
            for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="bi bi-star"></i> ';
            
            const companyElement = document.createElement('div');
            companyElement.className = 'company-item';
            companyElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <h6 class="company-name">${company.name}</h6>
                    <span class="badge bg-primary rounded-pill">${company.rating || 0}</span>
                </div>
                <p class="company-address mb-2">${company.address || 'Adres bilgisi yok'}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        ${company.phone ? `<small class="text-muted me-2"><i class="bi bi-telephone"></i> ${company.phone}</small>` : ''}
                        ${company.website ? `<small class="text-muted"><i class="bi bi-globe"></i> ${company.website}</small>` : ''}
                    </div>
                    <a href="#" data-view="saved" class="btn btn-sm btn-outline-primary">Detay</a>
                </div>
            `;
            
            dashboardSavedCompaniesContainer.appendChild(companyElement);
        });
        
        // Bootstrap ikonlarını ekle
        if (!document.getElementById('bootstrap-icons')) {
            const iconLink = document.createElement('link');
            iconLink.id = 'bootstrap-icons';
            iconLink.rel = 'stylesheet';
            iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
            document.head.appendChild(iconLink);
        }
    } catch (error) {
        console.error('Kaydedilen firmalar yüklenirken bir hata oluştu:', error);
        dashboardSavedCompaniesContainer.innerHTML = '<div class="text-center py-4"><p class="text-muted mb-0">Kaydedilen firmalar yüklenirken bir hata oluştu</p></div>';
    }
}

// Filtreleme Bölümünü Göster
function showFilterSection(results) {
    const filterSection = document.getElementById('filter-section');
    if (!filterSection) return;
    
    // Filtreleme bölümünü göster
    filterSection.classList.remove('d-none');
    
    // Konum filtresini doldur
    const locationFilter = document.getElementById('filter-location');
    if (locationFilter) {
        // Mevcut seçenekleri temizle
        locationFilter.innerHTML = '<option value="">Tüm Konumlar</option>';
        
        // Benzersiz konumları topla
        const uniqueLocations = [...new Set(results.map(item => {
            // Adres bilgisinden ilçe/şehir bilgisini çıkar
            const addressParts = item.formatted_address.split(',');
            if (addressParts.length >= 2) {
                return addressParts[addressParts.length - 2].trim();
            }
            return '';
        }))].filter(location => location !== '');
        
        // Konum seçeneklerini ekle
        uniqueLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }
    
    // Filtreleme butonuna olay dinleyicisi ekle
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        // Önceki olay dinleyicilerini kaldır
        const newBtn = applyFiltersBtn.cloneNode(true);
        applyFiltersBtn.parentNode.replaceChild(newBtn, applyFiltersBtn);
        
        // Yeni olay dinleyicisi ekle
        newBtn.addEventListener('click', () => {
            applyFilters(results);
        });
    }
    
    // Tüm sonuçları global değişkende sakla
    window.allSearchResults = results;
}

// Filtreleri Uygula
function applyFilters(results) {
    // Sonuçlar yoksa işlem yapma
    if (!results || !Array.isArray(results) || results.length === 0) {
        showNotification('Filtrelenecek sonuç bulunamadı', 'warning');
        return;
    }
    
    // Filtre değerlerini al
    const ratingFilter = document.getElementById('filter-rating').value;
    const locationFilter = document.getElementById('filter-location').value;
    
    // Filtreleme işlemi
    let filteredResults = [...results]; // Tüm sonuçların kopyasını al
    
    // Yıldız filtresini uygula
    if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        filteredResults = filteredResults.filter(item => 
            item.rating && item.rating >= minRating
        );
    }
    
    // Konum filtresini uygula
    if (locationFilter) {
        filteredResults = filteredResults.filter(item => {
            const addressParts = item.formatted_address.split(',');
            if (addressParts.length >= 2) {
                const itemLocation = addressParts[addressParts.length - 2].trim();
                return itemLocation === locationFilter;
            }
            return false;
        });
    }
    
    // Sonuçları göster
    const resultsContainer = document.getElementById('search-results');
    if (filteredResults.length === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Seçilen filtrelere uygun sonuç bulunamadı.
            </div>
        `;
    } else {
        displaySearchResults(filteredResults, resultsContainer);
        showNotification(`${filteredResults.length} sonuç filtrelendi`, 'success');
    }
}

// Firma Detaylarını Göster
async function showCompanyDetails(placeId) {
    // Önceki modalları temizle
    cleanupModals();
    
    // Yükleme modalını göster
    const loadingModal = createLoadingModal();
    const bsLoadingModal = new bootstrap.Modal(loadingModal);
    bsLoadingModal.show();
    
    // Zaman aşımı için zamanlayıcı
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')), 15000);
    });
    
    try {
        // İşletme detaylarını getir (zaman aşımı ile)
        const business = await Promise.race([
            getBusinessDetails(placeId),
            timeoutPromise
        ]);
        
        // Firma verilerini temizle ve düzenle
        const cleanedBusiness = cleanCompanyData(business);
        
        // Yükleme modalını gizle
        try {
            bsLoadingModal.hide();
        } catch (error) {
            console.warn('Yükleme modalı kapatılırken hata:', error);
        }
        
        // Detay modalını oluştur
        const modalId = 'companyDetailModal';
        let modal = document.getElementById(modalId);
        
        // Modal yoksa oluştur
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = modalId;
            modal.tabIndex = '-1';
            modal.setAttribute('aria-labelledby', 'companyDetailModalLabel');
            modal.setAttribute('aria-hidden', 'true');
            
            document.body.appendChild(modal);
        }
        
        // Telefon numarası formatla
        const phoneFormatted = cleanedBusiness.formatted_phone_number || 'Belirtilmemiş';
        const phoneForWhatsApp = cleanedBusiness.whatsapp_phone || formatPhoneForWhatsApp(cleanedBusiness.formatted_phone_number || cleanedBusiness.international_phone_number || '');
        
        // Yıldız gösterimi oluştur
        let starsHtml = '';
        const rating = cleanedBusiness.rating || 0;
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(rating)) {
                starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
            } else if (i - 0.5 <= rating) {
                starsHtml += '<i class="bi bi-star-half text-warning"></i>';
            } else {
                starsHtml += '<i class="bi bi-star text-warning"></i>';
            }
        }
        
        // Çalışma saatleri
        let hoursHtml = '<p class="text-muted">Çalışma saatleri bilgisi bulunamadı</p>';
        if (cleanedBusiness.opening_hours && cleanedBusiness.opening_hours.weekday_text) {
            hoursHtml = '<ul class="list-group list-group-flush">';
            cleanedBusiness.opening_hours.weekday_text.forEach(day => {
                hoursHtml += `<li class="list-group-item border-0 px-0 py-1">${day}</li>`;
            });
            hoursHtml += '</ul>';
        }
        
        // Fotoğraflar
        let photosHtml = '';
        if (cleanedBusiness.photos && cleanedBusiness.photos.length > 0) {
            photosHtml = `
                <div id="companyPhotosCarousel" class="carousel slide mb-4" data-bs-ride="carousel">
                    <div class="carousel-inner rounded">
            `;
            
            cleanedBusiness.photos.forEach((photo, index) => {
                photosHtml += `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <img src="${photo.url}" class="d-block w-100" alt="${cleanedBusiness.name} - Fotoğraf ${index + 1}">
                    </div>
                `;
            });
            
            photosHtml += `
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#companyPhotosCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Önceki</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#companyPhotosCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Sonraki</span>
                    </button>
                </div>
            `;
        }
        
        // Modal içeriği
        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="companyDetailModalLabel">${cleanedBusiness.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>
                    <div class="modal-body company-details">
                        ${photosHtml}
                        
                        <div class="info-section">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <div class="mb-2">
                                        ${starsHtml}
                                        <span class="ms-2 text-muted">${rating} (${cleanedBusiness.user_ratings_total || 0} değerlendirme)</span>
                                    </div>
                                    <p class="mb-1"><i class="bi bi-geo-alt text-primary me-2"></i>${cleanedBusiness.formatted_address || cleanedBusiness.vicinity || 'Adres belirtilmemiş'}</p>
                                </div>
                                <div>
                                    <a href="${cleanedBusiness.url}" target="_blank" class="btn btn-sm btn-outline-primary mb-2">
                                        <i class="bi bi-google me-1"></i> Google'da Görüntüle
                                    </a>
                                </div>
                            </div>
                            
                            <div class="row mt-4">
                                <div class="col-md-6">
                                    <h5><i class="bi bi-telephone text-primary me-2"></i>İletişim</h5>
                                    <p class="mb-1">
                                        <strong>Telefon:</strong> ${phoneFormatted}
                                        ${phoneForWhatsApp ? `
                                        <button class="btn btn-sm btn-success ms-2" onclick="sendWhatsAppFromDetails('${phoneForWhatsApp}', '${cleanedBusiness.name.replace(/'/g, "\\'")}')">
                                            <i class="bi bi-whatsapp me-1"></i> WhatsApp
                                        </button>` : ''}
                                    </p>
                                    <p class="mb-1">
                                        <strong>Web Sitesi:</strong> 
                                        ${cleanedBusiness.website ? `<a href="${cleanedBusiness.website}" target="_blank">${cleanedBusiness.website}</a>` : 'Belirtilmemiş'}
                                    </p>
                                    <p class="mb-1">
                                        <strong>E-posta:</strong> ${cleanedBusiness.email || 'Belirtilmemiş'}
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <h5><i class="bi bi-clock text-primary me-2"></i>Çalışma Saatleri</h5>
                                    ${hoursHtml}
                                </div>
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <h5><i class="bi bi-info-circle text-primary me-2"></i>Firma Bilgileri</h5>
                            <p class="mb-1"><strong>Tür:</strong> ${cleanedBusiness.types ? cleanedBusiness.types.map(type => type.replace(/_/g, ' ')).join(', ') : 'Belirtilmemiş'}</p>
                            <p class="mb-1"><strong>Fiyat Seviyesi:</strong> ${getPriceLevel(cleanedBusiness.price_level)}</p>
                            <p class="mb-1"><strong>Durum:</strong> ${getBusinessStatus(cleanedBusiness.business_status)}</p>
                        </div>
                        
                        <div class="info-section">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0"><i class="bi bi-star text-primary me-2"></i>Değerlendirmeler</h5>
                                <button class="btn btn-sm btn-outline-primary" id="addReviewBtn">
                                    <i class="bi bi-plus-circle me-1"></i> Değerlendirme Ekle
                                </button>
                            </div>
                            
                            <div id="reviewForm" class="card mb-3 d-none">
                                <div class="card-body">
                                    <h6 class="card-title">Değerlendirmenizi Yazın</h6>
                                    <div class="mb-3">
                                        <label class="form-label">Puanınız</label>
                                        <div class="rating-stars">
                                            <i class="bi bi-star star" data-rating="1"></i>
                                            <i class="bi bi-star star" data-rating="2"></i>
                                            <i class="bi bi-star star" data-rating="3"></i>
                                            <i class="bi bi-star star" data-rating="4"></i>
                                            <i class="bi bi-star star" data-rating="5"></i>
                                            <span class="rating-text ms-2">0/5</span>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Yorumunuz</label>
                                        <textarea class="form-control" id="reviewComment" rows="3"></textarea>
                                    </div>
                                    <div class="d-flex justify-content-end">
                                        <button class="btn btn-outline-secondary me-2" id="cancelReviewBtn">İptal</button>
                                        <button class="btn btn-primary" id="submitReviewBtn" data-place-id="${placeId}">Gönder</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="reviews-container" id="reviewsContainer">
                                <div class="text-center py-4">
                                    <div class="loading-spinner mx-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        <button type="button" class="btn btn-primary" id="saveCompanyBtn" data-place-id="${placeId}">
                            <i class="bi bi-bookmark me-1"></i> Kaydet
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Modal nesnesini oluştur
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Değerlendirmeleri yükle
        loadCompanyReviews(placeId);
        
        // Değerlendirme formunu göster/gizle
        const addReviewBtn = document.getElementById('addReviewBtn');
        const reviewForm = document.getElementById('reviewForm');
        const cancelReviewBtn = document.getElementById('cancelReviewBtn');
        
        if (addReviewBtn && reviewForm && cancelReviewBtn) {
            addReviewBtn.addEventListener('click', () => {
                reviewForm.classList.remove('d-none');
                addReviewBtn.classList.add('d-none');
                resetStars();
            });
            
            cancelReviewBtn.addEventListener('click', () => {
                reviewForm.classList.add('d-none');
                addReviewBtn.classList.remove('d-none');
            });
        }
        
        // Yıldız derecelendirme sistemi
        const stars = document.querySelectorAll('.rating-stars .star');
        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                highlightStars(rating);
            });
            
            star.addEventListener('mouseout', () => {
                const selectedRating = document.querySelector('.rating-stars').getAttribute('data-selected-rating');
                if (selectedRating) {
                    highlightStars(parseInt(selectedRating));
                } else {
                    resetStars();
                }
            });
            
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                setRating(rating);
            });
        });
        
        // Değerlendirme gönderme
        const submitReviewBtn = document.getElementById('submitReviewBtn');
        if (submitReviewBtn) {
            submitReviewBtn.addEventListener('click', () => {
                submitReview(placeId);
            });
        }
        
        // Firmayı kaydetme
        const saveCompanyBtn = document.getElementById('saveCompanyBtn');
        if (saveCompanyBtn) {
            saveCompanyBtn.addEventListener('click', () => {
                saveCompany(cleanedBusiness);
            });
        }
        
        // Modal kapatıldığında yükleme göstergesini kaldır
        modal.addEventListener('hidden.bs.modal', function() {
            cleanupModals();
        });
    } catch (error) {
        console.error('Firma detayları gösterilirken hata oluştu:', error);
        
        // Yükleme modalını gizle
        try {
            bsLoadingModal.hide();
        } catch (modalError) {
            console.warn('Yükleme modalı kapatılırken hata:', modalError);
        }
        
        // Tüm modalları temizle
        cleanupModals();
        
        // Hata mesajını göster
        showNotification('Firma detayları yüklenirken bir hata oluştu: ' + error.message, 'danger');
    }
}

// Yükleme Modalı Oluştur
function createLoadingModal() {
    // Önceki modalları temizle
    cleanupModals();
    
    // Yeni modal oluştur
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'loadingModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.setAttribute('data-bs-keyboard', 'false');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-body text-center py-4">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                    <h5 class="mb-0">Firma detayları yükleniyor...</h5>
                    <p class="text-muted mt-2 small">Lütfen bekleyin...</p>
                </div>
            </div>
        </div>
    `;
    
    // Modalı sayfaya ekle
    document.body.appendChild(modal);
    
    // Otomatik temizleme için zamanlayıcı ekle (10 saniye sonra)
    setTimeout(() => {
        if (modal && modal.parentNode) {
            try {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            } catch (error) {
                console.warn('Modal instance bulunamadı (timeout):', error);
            }
            
            // Tüm modalları temizle
            cleanupModals();
            
            // Hata mesajını göster
            showNotification('Firma detayları yüklenirken zaman aşımına uğradı. Lütfen tekrar deneyin.', 'warning');
        }
    }, 10000); // 10 saniye
    
    return modal;
}

// Yıldızları Vurgula
function highlightStars(rating) {
    const stars = document.querySelectorAll('.rating-stars .star');
    const ratingText = document.querySelector('.rating-text');
    
    stars.forEach((star, index) => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= rating) {
            star.querySelector('i').className = 'bi bi-star-fill text-warning';
        } else {
            star.querySelector('i').className = 'bi bi-star';
        }
    });
    
    ratingText.textContent = `${rating} Yıldız`;
}

// Yıldızları Sıfırla
function resetStars() {
    const stars = document.querySelectorAll('.rating-stars .star');
    const ratingText = document.querySelector('.rating-text');
    
    stars.forEach(star => {
        star.querySelector('i').className = 'bi bi-star';
    });
    
    ratingText.textContent = 'Puan seçin';
}

// Derecelendirmeyi Ayarla
function setRating(rating) {
    selectedRating = rating;
    highlightStars(rating);
}

// Yorum Gönder
async function submitReview(placeId) {
    try {
        // Kullanıcı oturum durumunu kontrol et
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            showNotification('Yorum yapmak için lütfen giriş yapın', 'warning');
            return;
        }
        
        // Form verilerini al
        const ratingStars = document.querySelector('.rating-stars');
        const rating = parseInt(ratingStars.getAttribute('data-selected-rating') || '0');
        const comment = document.getElementById('reviewComment').value.trim();
        
        // Form doğrulama
        if (!rating || rating < 1 || rating > 5) {
            showNotification('Lütfen 1-5 arası bir derecelendirme seçin', 'warning');
            return;
        }
        
        if (!comment) {
            showNotification('Lütfen bir yorum yazın', 'warning');
            return;
        }
        
        // Yükleme göstergesi
        const submitButton = document.getElementById('submitReviewBtn');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gönderiliyor...';
        
        // Yorumu gönder
        const result = await addCompanyReview(placeId, rating, comment);
        
        // Butonu eski haline getir
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        
        if (result.success) {
            showNotification('Değerlendirmeniz başarıyla eklendi', 'success');
            
            // Formu sıfırla ve gizle
            resetStars();
            document.getElementById('reviewComment').value = '';
            
            const reviewForm = document.getElementById('reviewForm');
            const addReviewBtn = document.getElementById('addReviewBtn');
            
            if (reviewForm) reviewForm.classList.add('d-none');
            if (addReviewBtn) addReviewBtn.classList.remove('d-none');
            
            // Yorumları yeniden yükle
            loadCompanyReviews(placeId);
        } else {
            showNotification(`Değerlendirme eklenemedi: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Yorum gönderme hatası:', error);
        showNotification('Değerlendirme gönderilirken bir hata oluştu: ' + error.message, 'danger');
        
        // Butonu eski haline getir
        const submitButton = document.getElementById('submitReviewBtn');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-send me-1"></i> Gönder';
        }
    }
}

// Geçici ID'li firmalar için basit detay modalı göster
function showSimpleCompanyDetails(company) {
    // Önceki modalları temizle
    cleanupModals();
    
    // Firma verilerini temizle ve düzenle
    const cleanedCompany = cleanCompanyData(company);
    
    // Yıldız derecelendirmesi oluştur
    let starsHtml = '';
    if (cleanedCompany.rating) {
        const fullStars = Math.floor(cleanedCompany.rating);
        const halfStar = cleanedCompany.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
        }
        
        if (halfStar) {
            starsHtml += '<i class="bi bi-star-half text-warning"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="bi bi-star text-warning"></i>';
        }
        
        starsHtml += `<span class="text-muted ms-1">(${cleanedCompany.user_ratings_total || 0})</span>`;
    }
    
    // Modal oluştur
    const modalId = 'simpleCompanyModal';
    let modal = document.getElementById(modalId);
    
    // Modal yoksa oluştur
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'simpleCompanyModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(modal);
    }
    
    // Telefon numarası kontrolü
    if (!cleanedCompany.formatted_phone_number && cleanedCompany.international_phone_number) {
        cleanedCompany.formatted_phone_number = cleanedCompany.international_phone_number;
    }
    const hasPhone = cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number || cleanedCompany.phone;
    const phoneDisplay = hasPhone || '<span class="text-muted">Telefon bilgisi bulunamadı</span>';
    
    // Web sitesi kontrolü
    const hasWebsite = cleanedCompany.website;
    
    // E-posta kontrolü
    if (!cleanedCompany.email && cleanedCompany.website) {
        cleanedCompany.email = extractEmailFromWebsite(cleanedCompany.website);
    }
    const hasEmail = cleanedCompany.email;
    
    // Adres bilgisi kontrolü
    if (!cleanedCompany.formatted_address && cleanedCompany.vicinity) {
        cleanedCompany.formatted_address = cleanedCompany.vicinity;
    }
    const addressDisplay = cleanedCompany.formatted_address || cleanedCompany.vicinity || '<span class="text-muted">Adres bilgisi bulunamadı</span>';
    
    // Modal içeriği
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="simpleCompanyModalLabel">${cleanedCompany.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-8">
                            <p class="mb-2">
                                <i class="bi bi-geo-alt text-primary me-2"></i>
                                <strong>Adres:</strong> ${addressDisplay}
                            </p>
                            <p class="mb-2">
                                <i class="bi bi-telephone text-primary me-2"></i>
                                <strong>Telefon:</strong> 
                                ${hasPhone ? 
                                    `<span class="text-dark">${hasPhone}</span>
                                    <a href="tel:${hasPhone.replace(/\s+/g, '')}" class="btn btn-sm btn-outline-primary ms-2">
                                        <i class="bi bi-telephone"></i> Ara
                                    </a>
                                    <button class="btn btn-sm btn-outline-success ms-1" onclick="sendWhatsAppFromDetails('${formatPhoneForWhatsApp(hasPhone)}', '${cleanedCompany.name.replace(/'/g, "\\'")}')">
                                        <i class="bi bi-whatsapp"></i> WhatsApp
                                    </button>` : 
                                    '<span class="text-muted">Telefon bilgisi bulunamadı</span>'}
                            </p>
                            <p class="mb-2">
                                <i class="bi bi-globe text-primary me-2"></i>
                                <strong>Web Sitesi:</strong> 
                                ${hasWebsite ? 
                                    `<a href="${cleanedCompany.website}" target="_blank" class="text-primary">${cleanedCompany.website}</a>
                                    <a href="${cleanedCompany.website}" target="_blank" class="btn btn-sm btn-outline-primary ms-2">
                                        <i class="bi bi-box-arrow-up-right"></i> Ziyaret Et
                                    </a>` : 
                                    '<span class="text-muted">Web sitesi bulunamadı</span>'}
                            </p>
                            <p class="mb-2">
                                <i class="bi bi-envelope text-primary me-2"></i>
                                <strong>E-posta:</strong> 
                                ${hasEmail ? 
                                    `<a href="mailto:${cleanedCompany.email}" class="text-primary">${cleanedCompany.email}</a>
                                    <a href="mailto:${cleanedCompany.email}" class="btn btn-sm btn-outline-primary ms-2">
                                        <i class="bi bi-envelope"></i> E-posta Gönder
                                    </a>` : 
                                    '<span class="text-muted">E-posta bilgisi bulunamadı</span>'}
                            </p>
                            <p class="mb-2">
                                <i class="bi bi-star text-primary me-2"></i>
                                <strong>Değerlendirme:</strong> ${starsHtml || '<span class="text-muted">Değerlendirme bilgisi bulunamadı</span>'}
                            </p>
                        </div>
                        <div class="col-md-4">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-body">
                                    <h5 class="card-title border-bottom pb-2">
                                        <i class="bi bi-map me-2 text-primary"></i>
                                        Haritada Göster
                                    </h5>
                                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedCompany.name)}&query_place_id=${encodeURIComponent(cleanedCompany.place_id)}" 
                                       target="_blank" class="btn btn-outline-primary w-100 mt-3">
                                        <i class="bi bi-map me-1"></i> Google Maps'te Aç
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                    <button type="button" class="btn btn-primary save-company-btn" data-place-id="${cleanedCompany.place_id}">
                        <i class="bi bi-bookmark me-1"></i> Kaydet
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Modal nesnesini oluştur
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
    
    // Modal kapatıldığında yükleme göstergesini kaldır
    modal.addEventListener('hidden.bs.modal', function() {
        cleanupModals();
    });
    
    // Kaydet butonuna olay dinleyicisi ekle
    const saveBtn = modal.querySelector('.save-company-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            try {
                // Kullanıcı kontrolü
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    showNotification('Firmayı kaydetmek için giriş yapmalısınız', 'warning');
                    return;
                }
                
                // Firma bilgilerini hazırla
                const companyData = {
                    place_id: cleanedCompany.place_id,
                    name: cleanedCompany.name,
                    address: cleanedCompany.formatted_address || cleanedCompany.vicinity || '',
                    phone: cleanedCompany.formatted_phone_number || cleanedCompany.international_phone_number || cleanedCompany.phone || '',
                    website: cleanedCompany.website || '',
                    rating: cleanedCompany.rating || 0,
                    reviews: cleanedCompany.user_ratings_total || 0
                };
                
                // Firmayı kaydet
                const result = await saveCompanies([companyData], user.id);
                
                if (result.success) {
                    showNotification('Firma başarıyla kaydedildi', 'success');
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="bi bi-bookmark-check me-1"></i> Kaydedildi';
                } else {
                    showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
                }
            } catch (error) {
                console.error('Firma kaydedilemedi:', error);
                showNotification('Firma kaydedilemedi: ' + error.message, 'danger');
            }
        });
    }
}

// Değişiklik: Tümünü Seç ve Seçimi Temizle butonlarının olay dinleyicilerini showPage fonksiyonunun dışına taşıyorum
// ve sayfa yüklendikten sonra çalışacak şekilde düzenliyorum
function updateBulkActionButtons() {
    // Tümünü Seç butonuna olay dinleyicisi ekle
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.onclick = function() {
            const checkboxes = document.querySelectorAll('#search-results .form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
            return false; // Event'i durdur
        };
    }
    
    // Seçimi Temizle butonuna olay dinleyicisi ekle
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    if (deselectAllBtn) {
        deselectAllBtn.onclick = function() {
            const checkboxes = document.querySelectorAll('#search-results .form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            return false; // Event'i durdur
        };
    }
}

// Tüm sonuçları global değişkende sakla - Bu satırı da kaldırıyoruz çünkü validResults bu kapsamda tanımlı değil
// window.allSearchResults = validResults;

// Fiyat Seviyesini Metin Olarak Göster
function getPriceLevel(priceLevel) {
    switch (priceLevel) {
        case 0:
            return 'Ücretsiz';
        case 1:
            return 'Ucuz';
        case 2:
            return 'Orta';
        case 3:
            return 'Pahalı';
        case 4:
            return 'Çok Pahalı';
        default:
            return 'Belirtilmemiş';
    }
}

// İşletme Durumunu Metin Olarak Göster
function getBusinessStatus(status) {
    switch (status) {
        case 'OPERATIONAL':
            return '<span class="badge bg-success">Açık</span>';
        case 'CLOSED_TEMPORARILY':
            return '<span class="badge bg-warning">Geçici Olarak Kapalı</span>';
        case 'CLOSED_PERMANENTLY':
            return '<span class="badge bg-danger">Kalıcı Olarak Kapalı</span>';
        default:
            return '<span class="badge bg-secondary">Durum Belirtilmemiş</span>';
    }
}

// Firma Yorumlarını Yükle
async function loadCompanyReviews(placeId) {
    try {
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (!reviewsContainer) return;
        
        // Yükleme göstergesini göster
        reviewsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
                <p class="mt-2 text-muted">Yorumlar yükleniyor...</p>
            </div>
        `;
        
        // Yorumları getir
        const reviews = await getCompanyReviews(placeId);
        
        // Yorumları göster
        if (!reviews || reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-chat-left-text text-muted" style="font-size: 2rem;"></i>
                    <p class="mt-2 text-muted">Henüz yorum yapılmamış</p>
                </div>
            `;
            return;
        }
        
        // Yorumları listele
        reviewsContainer.innerHTML = '';
        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'card mb-3 review-item';
            
            // Yıldız gösterimi oluştur
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(review.rating)) {
                    starsHtml += '<i class="bi bi-star-fill text-warning"></i> ';
                } else if (i - 0.5 <= review.rating) {
                    starsHtml += '<i class="bi bi-star-half text-warning"></i> ';
                } else {
                    starsHtml += '<i class="bi bi-star text-warning"></i> ';
                }
            }
            
            // Tarih formatla
            const reviewDate = review.time ? new Date(review.time * 1000).toLocaleDateString('tr-TR') : 'Belirtilmemiş';
            
            reviewElement.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <h6 class="mb-0">${review.author_name || 'Anonim'}</h6>
                            <div class="text-muted small">${reviewDate}</div>
                        </div>
                        <div class="rating">
                            ${starsHtml}
                        </div>
                    </div>
                    <p class="card-text">${review.text || 'Yorum yok'}</p>
                </div>
            `;
            
            reviewsContainer.appendChild(reviewElement);
        });
    } catch (error) {
        console.error('Yorumlar yüklenirken hata oluştu:', error);
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Yorumlar yüklenirken bir hata oluştu: ${error.message}
                </div>
            `;
        }
    }
}

// Firmayı Kaydet
async function saveCompany(business) {
    try {
        // Kullanıcı kontrolü
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            showNotification('Firmayı kaydetmek için giriş yapmalısınız', 'warning');
            return;
        }
        
        // Firma bilgilerini hazırla
        const companyData = {
            place_id: business.place_id,
            name: business.name,
            address: business.formatted_address || business.vicinity || '',
            phone: business.formatted_phone_number || business.international_phone_number || '',
            website: business.website || '',
            rating: business.rating || 0,
            reviews: business.user_ratings_total || 0
        };
        
        // Firmayı kaydet
        const result = await saveCompanies([companyData], user.id);
        
        if (result.success) {
            showNotification('Firma başarıyla kaydedildi', 'success');
            
            // Kaydet butonunu güncelle
            const saveCompanyBtn = document.getElementById('saveCompanyBtn');
            if (saveCompanyBtn) {
                saveCompanyBtn.disabled = true;
                saveCompanyBtn.innerHTML = '<i class="bi bi-bookmark-check me-1"></i> Kaydedildi';
            }
        } else {
            showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Firma kaydedilemedi:', error);
        showNotification('Firma kaydedilemedi: ' + error.message, 'danger');
    }
}

// E-posta bilgisini website'den çıkar
function extractEmailFromWebsite(website) {
    // api.js'deki fonksiyonu çağır
    try {
        if (!website) return null;
        
        const url = new URL(website);
        const domain = url.hostname.replace('www.', '');
        
        // Yaygın e-posta formatları
        const possibleEmails = [
            `info@${domain}`,
            `contact@${domain}`,
            `iletisim@${domain}`,
            `bilgi@${domain}`,
            `destek@${domain}`,
            `support@${domain}`
        ];
        
        return possibleEmails[0]; // İlk olasılığı döndür
    } catch (error) {
        console.warn('E-posta adresi çıkarılamadı:', error);
        return null;
    }
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Üst kısımdaki butonları aktif hale getir
    activateTopButtons();
    
    // Diğer başlangıç işlemleri
    // ... existing code ...
    
    // Alt kısımdaki butonlara olay dinleyicileri ekle
    // setupBottomButtons(); // Alt kısımdaki butonları kaldırdığımız için bu fonksiyonu çağırmıyoruz
});

// Üst kısımdaki butonları aktif hale getir
function activateTopButtons() {
    const topWhatsAppBtn = document.querySelector('button.whatsapp-btn');
    const topEmailBtn = document.querySelector('button.email-btn');
    const topSaveBtn = document.querySelector('button.save-btn');
    
    if (topWhatsAppBtn) {
        topWhatsAppBtn.disabled = false;
        topWhatsAppBtn.addEventListener('click', handleSendWhatsApp);
    }
    
    if (topEmailBtn) {
        topEmailBtn.disabled = false;
        topEmailBtn.addEventListener('click', handleSendEmail);
    }
    
    if (topSaveBtn) {
        topSaveBtn.disabled = false;
        topSaveBtn.addEventListener('click', handleSaveResults);
    }
}

// Firma detayları modalını temizle
function cleanupModals() {
    // Tüm modalleri temizle
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        try {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        } catch (error) {
            console.warn('Modal kapatılırken hata:', error);
        }
        
        // Modal elementini kaldır
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    });
    
    // Backdrop'ları temizle
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => {
        if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
    });
    
    // Body'den modal-open sınıfını kaldır
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// Alt kısımdaki butonlara olay dinleyicileri ekle
function setupBottomButtons() {
    // Alt kısımdaki butonları kaldırdığımız için bu fonksiyonu boşaltıyoruz
    // Ancak tamamen silmiyoruz çünkü başka yerlerden çağrılabilir
    console.log("Alt kısımdaki butonlar kaldırıldı");
}

// Firma verilerini temizle ve düzenle
function cleanCompanyData(company) {
    // Kopya oluştur
    const cleanedCompany = { ...company };
    
    // Telefon numarası düzenleme
    if (cleanedCompany.formatted_phone_number) {
        cleanedCompany.formatted_phone_number = cleanedCompany.formatted_phone_number.trim();
    } else if (cleanedCompany.international_phone_number) {
        cleanedCompany.formatted_phone_number = cleanedCompany.international_phone_number.trim();
    }
    
    // Adres düzenleme
    if (cleanedCompany.formatted_address) {
        cleanedCompany.formatted_address = cleanedCompany.formatted_address.trim();
    } else if (cleanedCompany.vicinity) {
        cleanedCompany.formatted_address = cleanedCompany.vicinity.trim();
    }
    
    // Web sitesi düzenleme
    if (cleanedCompany.website) {
        cleanedCompany.website = cleanedCompany.website.trim();
    }
    
    // E-posta düzenleme
    if (!cleanedCompany.email && cleanedCompany.website) {
        cleanedCompany.email = extractEmailFromWebsite(cleanedCompany.website);
    }
    
    return cleanedCompany;
}