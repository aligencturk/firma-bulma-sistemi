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
    
    // Çıkış Butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Çıkış yapmadan önce onay iste
            if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
                handleLogout();
            }
        });
    }
    
    // Şifremi Unuttum Bağlantısı
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Şifremi unuttum işlevselliği daha sonra eklenecek
            alert('Şifremi unuttum özelliği yakında eklenecek');
        });
    }
    
    // Arama Formu
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleSearch();
        });
    }
    
    // Hızlı Arama Formu
    const quickSearchForm = document.getElementById('quick-search-form');
    if (quickSearchForm) {
        quickSearchForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Kullanıcı oturum durumunu kontrol et
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                // Kullanıcı giriş yapmamışsa uyarı göster ve giriş sayfasına yönlendir
                showNotification('Arama yapmak için lütfen giriş yapın', 'warning');
                changeView('login');
                return;
            }
            
            // Form verilerini al
            const businessType = quickSearchForm.querySelector('input').value;
            const location = document.getElementById('quick-location').value;
            
            // Form doğrulama
            if (!businessType || !location) {
                showNotification('Lütfen firma türü ve konum girin', 'danger');
                return;
            }
            
            // Arama sayfasına yönlendir
            changeView('search');
            
            // Arama formunu doldur
            document.getElementById('business-type').value = businessType;
            document.getElementById('location').value = location;
            
            // Aramayı başlat
            setTimeout(() => {
                handleSearch();
            }, 300);
        });
    }
    
    // E-posta Gönderme Butonu
    const sendEmailBtn = document.getElementById('send-email-btn');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', () => {
            // E-posta modalını göster
            const emailModal = new bootstrap.Modal(document.getElementById('emailModal'));
            emailModal.show();
        });
    }
    
    // E-posta Gönderme Formu
    const sendEmailSubmit = document.getElementById('send-email-submit');
    if (sendEmailSubmit) {
        sendEmailSubmit.addEventListener('click', handleSendEmail);
    }
    
    // Sonuçları Kaydetme Butonu
    const saveResultsBtn = document.getElementById('save-results-btn');
    if (saveResultsBtn) {
        saveResultsBtn.addEventListener('click', handleSaveResults);
    }
    
    console.log('Olay dinleyicileri eklendi');
    
    // Tümünü Seç Butonu
    document.addEventListener('click', function(e) {
        if (e.target.matches('#select-all-btn')) {
            const container = document.getElementById('search-results');
            if (container) {
                const checkboxes = container.querySelectorAll('.form-check-input');
                const isAllChecked = Array.from(checkboxes).every(cb => cb.checked);
                
                checkboxes.forEach(checkbox => {
                    checkbox.checked = !isAllChecked;
                });
                
                // Buton metnini güncelle
                e.target.innerHTML = `<i class="bi bi-${!isAllChecked ? 'check-all' : 'x-lg'} me-1"></i> ${!isAllChecked ? 'Seçimi Temizle' : 'Tümünü Seç'}`;
                
                // Toplu işlem butonlarını güncelle
                updateBulkActionButtons();
            }
        }
    });
    
    // WhatsApp Butonu
    document.addEventListener('click', function(e) {
        if (e.target.matches('#send-whatsapp-btn') || e.target.closest('#send-whatsapp-btn')) {
            handleSendWhatsApp();
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
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'company-results';
    
    validResults.forEach(company => {
        const row = document.createElement('div');
        row.className = 'company-row card mb-3 shadow-sm';
        
        // Telefon numarasını formatla
        let phoneDisplay = 'Telefon bilgisi bulunamadı';
        if (company.formatted_phone_number || company.international_phone_number || company.phone) {
            const phone = company.formatted_phone_number || company.international_phone_number || company.phone;
            phoneDisplay = `<a href="tel:${phone.replace(/\s+/g, '')}" class="text-decoration-none">
                <i class="bi bi-telephone me-2"></i>${phone}
            </a>`;
        }
        
        // Web sitesini formatla
        let websiteDisplay = 'Web sitesi bulunamadı';
        if (company.website) {
            websiteDisplay = `<a href="${company.website}" target="_blank" class="text-decoration-none">
                <i class="bi bi-globe me-2"></i>${company.website}
            </a>`;
        }
        
        // E-posta adresini formatla
        let emailDisplay = 'E-posta bilgisi bulunamadı';
        if (company.email) {
            emailDisplay = `<a href="mailto:${company.email}" class="text-decoration-none">
                <i class="bi bi-envelope me-2"></i>${company.email}
            </a>`;
        }
        
        row.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <div class="form-check me-3">
                        <input type="checkbox" class="form-check-input" value="${company.place_id}">
                    </div>
                    <h5 class="card-title mb-0 company-name">${company.name}</h5>
                </div>
                
                <div class="company-details">
                    <p class="mb-2 company-address">
                        <i class="bi bi-geo-alt me-2"></i>
                        ${company.formatted_address || company.vicinity || 'Adres bilgisi bulunamadı'}
                    </p>
                    <p class="mb-2 company-phone">${phoneDisplay}</p>
                    <p class="mb-2 company-website">${websiteDisplay}</p>
                    <p class="mb-2 company-email">${emailDisplay}</p>
                </div>
                
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div class="company-rating">
                        ${company.rating ? `
                            <span class="text-warning">
                                ${'★'.repeat(Math.floor(company.rating))}${company.rating % 1 >= 0.5 ? '½' : ''}
                            </span>
                            <span class="text-muted">(${company.user_ratings_total || 0})</span>
                        ` : 'Değerlendirme yok'}
                    </div>
                    <div class="company-actions">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="showCompanyDetails('${company.place_id}')">
                            <i class="bi bi-info-circle me-1"></i>Detaylar
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="handleSendWhatsApp(['${company.place_id}'])">
                            <i class="bi bi-whatsapp me-1"></i>WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(row);
    });
    
    container.appendChild(resultsContainer);
    
    // Sayfalama ekle
    if (validResults.length > 10) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container mt-4';
        container.appendChild(paginationContainer);
        
        const itemsPerPage = 10;
        let currentPage = 1;
        
        function showPage(page) {
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            
            const rows = resultsContainer.querySelectorAll('.company-row');
            rows.forEach((row, index) => {
                row.style.display = (index >= start && index < end) ? '' : 'none';
            });
            
            updatePagination();
        }
        
        function updatePagination() {
            const totalPages = Math.ceil(validResults.length / itemsPerPage);
            
            let paginationHtml = '<nav><ul class="pagination justify-content-center">';
            
            // Önceki sayfa
            paginationHtml += `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
            `;
            
            // Sayfa numaraları
            for (let i = 1; i <= totalPages; i++) {
                paginationHtml += `
                    <li class="page-item ${currentPage === i ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
            
            // Sonraki sayfa
            paginationHtml += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            `;
            
            paginationHtml += '</ul></nav>';
            paginationContainer.innerHTML = paginationHtml;
            
            // Sayfalama olaylarını ekle
            paginationContainer.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const newPage = parseInt(link.dataset.page);
                    if (!isNaN(newPage) && newPage > 0 && newPage <= totalPages) {
                        currentPage = newPage;
                        showPage(currentPage);
                    }
                });
            });
        }
        
        // İlk sayfayı göster
        showPage(1);
    }
    
    // Toplu işlem butonlarını güncelle
    updateBulkActionButtons();
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
    bulkActionsContainer.className = 'd-flex justify-content-between align-items-center mb-3';
    bulkActionsContainer.innerHTML = `
        <div>
            <button class="btn btn-sm btn-outline-primary me-2" id="select-all-btn">
                <i class="bi bi-check-all me-1"></i> Tümünü Seç
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" id="deselect-all-btn">
                <i class="bi bi-x-lg me-1"></i> Seçimi Temizle
            </button>
        </div>
        <div>
            <button class="btn btn-sm btn-outline-success me-2" id="send-whatsapp-btn">
                <i class="bi bi-whatsapp me-1"></i> WhatsApp
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" id="send-email-btn">
                <i class="bi bi-envelope me-1"></i> E-posta
            </button>
            <button class="btn btn-sm btn-outline-primary" id="save-results-btn">
                <i class="bi bi-bookmark me-1"></i> Kaydet
            </button>
        </div>
    `;
    container.appendChild(bulkActionsContainer);
    
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
            const companyItem = document.createElement('div');
            companyItem.className = 'list-group-item border-0 shadow-sm mb-3 p-0';
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (company.rating) {
                const fullStars = Math.floor(company.rating);
                const halfStar = company.rating % 1 >= 0.5;
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
                
                starsHtml += `<span class="text-muted ms-1">(${company.user_ratings_total || 0})</span>`;
            }
            
            // Firma türlerini göster
            let typesHtml = '';
            if (company.types && company.types.length > 0) {
                typesHtml = company.types.slice(0, 3).map(type => 
                    `<span class="badge bg-light text-dark me-1">${type.replace(/_/g, ' ')}</span>`
                ).join('');
            }
            
            // Firma kartını oluştur
            companyItem.innerHTML = `
                <div class="card border-0">
                    <div class="card-header bg-white d-flex align-items-center py-3">
                        <div class="form-check me-2">
                            <input class="form-check-input" type="checkbox" value="${company.place_id}" id="check-${company.place_id}">
                            <label class="form-check-label" for="check-${company.place_id}"></label>
                        </div>
                        <h5 class="card-title mb-0 flex-grow-1">${company.name}</h5>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-outline-primary me-2 view-details-btn" data-place-id="${company.place_id}">
                                <i class="bi bi-info-circle me-1"></i> Detaylar
                            </button>
                            <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${company.place_id}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="card-text mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    ${company.formatted_address}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone text-primary me-2"></i>
                                    ${company.formatted_phone_number || 'Telefon bilgisi bulunamadı'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-globe text-primary me-2"></i>
                                    ${company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : 'Web sitesi bulunamadı'}
                                </p>
                                <p class="card-text mb-0">
                                    <i class="bi bi-envelope text-primary me-2"></i>
                                    ${company.email || 'E-posta bilgisi bulunamadı'}
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
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name)}&query_place_id=${encodeURIComponent(company.place_id)}" 
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
    bulkActionsContainer.className = 'd-flex justify-content-between align-items-center mb-3';
    bulkActionsContainer.innerHTML = `
        <div>
            <button class="btn btn-sm btn-outline-primary me-2" id="select-all-btn">
                <i class="bi bi-check-all me-1"></i> Tümünü Seç
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" id="deselect-all-btn">
                <i class="bi bi-x-lg me-1"></i> Seçimi Temizle
            </button>
        </div>
        <div>
            <button class="btn btn-sm btn-outline-success me-2" id="send-whatsapp-btn">
                <i class="bi bi-whatsapp me-1"></i> WhatsApp
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" id="send-email-btn">
                <i class="bi bi-envelope me-1"></i> E-posta
            </button>
            <button class="btn btn-sm btn-outline-primary" id="save-results-btn">
                <i class="bi bi-bookmark me-1"></i> Kaydet
            </button>
        </div>
    `;
    container.appendChild(bulkActionsContainer);
    
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
            const companyItem = document.createElement('div');
            companyItem.className = 'list-group-item border-0 shadow-sm mb-3 p-0';
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (company.rating) {
                const fullStars = Math.floor(company.rating);
                const halfStar = company.rating % 1 >= 0.5;
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
                
                starsHtml += `<span class="text-muted ms-1">(${company.user_ratings_total || 0})</span>`;
            }
            
            // Firma türlerini göster
            let typesHtml = '';
            if (company.types && company.types.length > 0) {
                typesHtml = company.types.slice(0, 3).map(type => 
                    `<span class="badge bg-light text-dark me-1">${type.replace(/_/g, ' ')}</span>`
                ).join('');
            }
            
            // Firma kartını oluştur
            companyItem.innerHTML = `
                <div class="card border-0">
                    <div class="card-header bg-white d-flex align-items-center py-3">
                        <div class="form-check me-2">
                            <input class="form-check-input" type="checkbox" value="${company.place_id}" id="check-${company.place_id}">
                            <label class="form-check-label" for="check-${company.place_id}"></label>
                        </div>
                        <h5 class="card-title mb-0 flex-grow-1">${company.name}</h5>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-outline-primary me-2 view-details-btn" data-place-id="${company.place_id}">
                                <i class="bi bi-info-circle me-1"></i> Detaylar
                            </button>
                            <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${company.place_id}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="card-text mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    ${company.formatted_address}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone text-primary me-2"></i>
                                    ${company.formatted_phone_number || 'Telefon bilgisi bulunamadı'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-globe text-primary me-2"></i>
                                    ${company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : 'Web sitesi bulunamadı'}
                                </p>
                                <p class="card-text mb-0">
                                    <i class="bi bi-envelope text-primary me-2"></i>
                                    ${company.email || 'E-posta bilgisi bulunamadı'}
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
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name)}&query_place_id=${encodeURIComponent(company.place_id)}" 
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
    bulkActionsContainer.className = 'd-flex justify-content-between align-items-center mb-3';
    bulkActionsContainer.innerHTML = `
        <div>
            <button class="btn btn-sm btn-outline-primary me-2" id="select-all-btn">
                <i class="bi bi-check-all me-1"></i> Tümünü Seç
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" id="deselect-all-btn">
                <i class="bi bi-x-lg me-1"></i> Seçimi Temizle
            </button>
        </div>
        <div>
            <button class="btn btn-sm btn-outline-success me-2" id="send-whatsapp-btn">
                <i class="bi bi-whatsapp me-1"></i> WhatsApp
            </button>
            <button class="btn btn-sm btn-outline-primary me-2" id="send-email-btn">
                <i class="bi bi-envelope me-1"></i> E-posta
            </button>
            <button class="btn btn-sm btn-outline-primary" id="save-results-btn">
                <i class="bi bi-bookmark me-1"></i> Kaydet
            </button>
        </div>
    `;
    container.appendChild(bulkActionsContainer);
    
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
            const companyItem = document.createElement('div');
            companyItem.className = 'list-group-item border-0 shadow-sm mb-3 p-0';
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (company.rating) {
                const fullStars = Math.floor(company.rating);
                const halfStar = company.rating % 1 >= 0.5;
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
                
                starsHtml += `<span class="text-muted ms-1">(${company.user_ratings_total || 0})</span>`;
            }
            
            // Firma türlerini göster
            let typesHtml = '';
            if (company.types && company.types.length > 0) {
                typesHtml = company.types.slice(0, 3).map(type => 
                    `<span class="badge bg-light text-dark me-1">${type.replace(/_/g, ' ')}</span>`
                ).join('');
            }
            
            // Firma kartını oluştur
            companyItem.innerHTML = `
                <div class="card border-0">
                    <div class="card-header bg-white d-flex align-items-center py-3">
                        <div class="form-check me-2">
                            <input class="form-check-input" type="checkbox" value="${company.place_id}" id="check-${company.place_id}">
                            <label class="form-check-label" for="check-${company.place_id}"></label>
                        </div>
                        <h5 class="card-title mb-0 flex-grow-1">${company.name}</h5>
                        <div class="d-flex">
                            <button class="btn btn-sm btn-outline-primary me-2 view-details-btn" data-place-id="${company.place_id}">
                                <i class="bi bi-info-circle me-1"></i> Detaylar
                            </button>
                            <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${company.place_id}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="card-text mb-2">
                                    <i class="bi bi-geo-alt text-primary me-2"></i>
                                    ${company.formatted_address}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-telephone text-primary me-2"></i>
                                    ${company.formatted_phone_number || 'Telefon bilgisi bulunamadı'}
                                </p>
                                <p class="card-text mb-2">
                                    <i class="bi bi-globe text-primary me-2"></i>
                                    ${company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : 'Web sitesi bulunamadı'}
                                </p>
                                <p class="card-text mb-0">
                                    <i class="bi bi-envelope text-primary me-2"></i>
                                    ${company.email || 'E-posta bilgisi bulunamadı'}
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
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name)}&query_place_id=${encodeURIComponent(company.place_id)}" 
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
        
        // Global sonuçlarda bulunamazsa DOM'dan al
        const row = checkbox.closest('.company-row');
        if (row) {
            const nameElement = row.querySelector('.company-name');
            const phoneElement = row.querySelector('.company-phone');
            const addressElement = row.querySelector('.company-address');
            
            if (nameElement) {
                const company = {
                    place_id: placeId,
                    name: nameElement.textContent.trim(),
                    phone: phoneElement ? phoneElement.textContent.trim() : '',
                    formatted_address: addressElement ? addressElement.textContent.trim() : ''
                };
                
                // Telefon numarasını temizle
                if (company.phone) {
                    company.phone = company.phone
                        .replace('Telefon:', '')
                        .replace('Telefon bilgisi bulunamadı', '')
                        .replace(/[\s\S]*?bi-telephone[\s\S]*?me-2[\s\S]*?\>\s*/, '')
                        .trim();
                }
                
                console.log('Firma DOM\'dan alındı:', company);
                selectedCompanies.push(company);
            }
        }
    });
    
    console.log('Toplam seçilen firma sayısı:', selectedCompanies.length);
    return selectedCompanies;
}

// WhatsApp Mesajı Gönderme İşlemi
function handleSendWhatsApp() {
    console.log('WhatsApp gönderme işlemi başlatılıyor...');
    
    // Seçili firmaları al
    const selectedCompanies = getSelectedCompanies();
    console.log('Seçilen firmalar:', selectedCompanies);
    
    if (selectedCompanies.length === 0) {
        showNotification('Lütfen en az bir firma seçin', 'warning');
        return;
    }
    
    // WhatsApp modalını oluştur ve göster
    createWhatsAppModal();
    
    // Modal içindeki gönder butonuna tıklanınca
    const sendButton = document.querySelector('#whatsappModal .send-whatsapp-btn');
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const messageInput = document.querySelector('#whatsappModal #whatsapp-message');
            if (messageInput && messageInput.value.trim()) {
                sendWhatsAppMessage(selectedCompanies, messageInput.value.trim());
                bootstrap.Modal.getInstance(document.getElementById('whatsappModal')).hide();
            } else {
                showNotification('Lütfen bir mesaj yazın', 'warning');
            }
        });
    }
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
    if (!phone) return null;
    
    // Tüm boşlukları, parantezleri, tire ve artı işaretlerini kaldır
    let cleaned = phone.replace(/[\s\(\)\-\+]/g, '');
    
    // Sadece rakamları al
    cleaned = cleaned.replace(/[^\d]/g, '');
    
    // Geçerli bir numara mı kontrol et
    if (cleaned.length < 10) {
        console.warn('Geçersiz telefon numarası (çok kısa):', phone);
        return null;
    }
    
    // Türkiye numarası mı kontrol et ve formatla
    if (cleaned.startsWith('0')) {
        // Baştaki 0'ı kaldır ve 90 ekle
        cleaned = '90' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
        // 10 haneli numara (5XX XXX XXXX) - Türkiye numarası olarak kabul et
        cleaned = '90' + cleaned;
    } else if (cleaned.startsWith('90') && cleaned.length >= 12) {
        // Zaten 90 ile başlıyor, olduğu gibi bırak
    } else if (!cleaned.startsWith('90') && cleaned.length >= 10) {
        // Diğer ülke numaraları için olduğu gibi bırak
        console.log('Türkiye dışı numara olabilir:', cleaned);
    }
    
    console.log('Formatlanmış telefon:', cleaned);
    return cleaned;
}

// WhatsApp Modal Oluştur
function createWhatsAppModal() {
    // Varolan modalı kontrol et
    let modalElement = document.getElementById('whatsappModal');
    if (modalElement) {
        modalElement.remove();
    }
    
    // Yeni modal oluştur
    modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'whatsappModal';
    modalElement.setAttribute('tabindex', '-1');
    
    // Modal içeriği
    modalElement.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-whatsapp text-success me-2"></i>
                        WhatsApp Mesajı Gönder
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-4">
                        <label class="form-label">Mesaj Şablonları</label>
                        <select class="form-select" id="whatsapp-template">
                            <option value="">Şablon Seçin</option>
                            <option value="promotional">Tanıtım Mesajı</option>
                            <option value="proposal">Teklif Mesajı</option>
                            <option value="appointment">Randevu Talebi</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Mesaj</label>
                        <textarea class="form-control" id="whatsapp-message" rows="5" 
                            placeholder="Mesajınızı yazın... Değişkenler için: {firma_adi}, {tarih}"></textarea>
                        <div class="form-text">
                            Kullanılabilir değişkenler:
                            <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="insertWhatsAppVariable('{firma_adi}')">
                                {firma_adi}
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary me-1" onclick="insertWhatsAppVariable('{tarih}')">
                                {tarih}
                            </button>
                        </div>
                    </div>
                    
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>Bilgi:</strong> Mesajınız her firma için otomatik olarak kişiselleştirilecektir.
                    </div>
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
    
    // Modalı sayfaya ekle
    document.body.appendChild(modalElement);
    
    // Şablon seçimi değiştiğinde
    const templateSelect = modalElement.querySelector('#whatsapp-template');
    const messageTextarea = modalElement.querySelector('#whatsapp-message');
    
    if (templateSelect && messageTextarea) {
        templateSelect.addEventListener('change', function() {
            const templates = {
                promotional: `Merhaba {firma_adi},\n\nSize ürün ve hizmetlerimizi tanıtmak isteriz. Detaylı bilgi almak ister misiniz?\n\nİyi çalışmalar,`,
                proposal: `Merhaba {firma_adi},\n\n{tarih} tarihli görüşmemize istinaden size özel teklifimizi paylaşmak isteriz. Müsait olduğunuz bir zaman diliminde detayları konuşabilir miyiz?\n\nİyi çalışmalar,`,
                appointment: `Merhaba {firma_adi},\n\nSizinle bir görüşme ayarlamak istiyoruz. {tarih} tarihinde müsait misiniz?\n\nİyi çalışmalar,`
            };
            
            messageTextarea.value = templates[this.value] || '';
        });
    }
    
    // Modalı göster
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    return modalElement;
}

// WhatsApp değişkeni ekle
function insertWhatsAppVariable(variable) {
    const messageTextarea = document.getElementById('whatsapp-message');
    if (!messageTextarea) return;
    
    const start = messageTextarea.selectionStart;
    const end = messageTextarea.selectionEnd;
    const text = messageTextarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    messageTextarea.value = before + variable + after;
    messageTextarea.focus();
    messageTextarea.selectionStart = messageTextarea.selectionEnd = start + variable.length;
    
    // Değişken eklendiğinde bildirim göster
    const variableName = variable.replace(/{|}/g, '');
    showNotification(`"${variableName}" değişkeni eklendi`, 'info');
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
    // Mevcut yükleme modalını temizle
    const existingLoadingModal = document.getElementById('loadingModal');
    if (existingLoadingModal) {
        const existingModalInstance = bootstrap.Modal.getInstance(existingLoadingModal);
        if (existingModalInstance) {
            existingModalInstance.hide();
        }
        existingLoadingModal.remove();
    }
    
    try {
        // placeId kontrolü
        if (!placeId) {
            console.error('Geçersiz firma ID\'si: undefined veya null');
            showNotification('Geçersiz firma ID\'si', 'danger');
            return;
        }
        
        if (typeof placeId !== 'string') {
            console.error('Geçersiz firma ID\'si türü:', typeof placeId);
            showNotification('Geçersiz firma ID\'si türü', 'danger');
            return;
        }
        
        if (placeId.trim() === '') {
            console.error('Boş firma ID\'si');
            showNotification('Boş firma ID\'si', 'danger');
            return;
        }
        
        // place_id formatını kontrol et
        if (!placeId.startsWith('ChIJ') && !placeId.startsWith('Eh')) {
            console.error('Geçersiz place_id formatı (ChIJ ile başlamıyor):', placeId);
            showNotification('Geçersiz firma ID formatı', 'danger');
            return;
        }
        
        console.log('Firma detayları getiriliyor, placeId:', placeId);
        
        // Yükleme göstergesi
        const loadingModal = createLoadingModal();
        const loadingModalInstance = new bootstrap.Modal(loadingModal);
        loadingModalInstance.show();
        
        // Yükleme modalı için timeout ayarla (30 saniye sonra otomatik kapanacak)
        const loadingTimeout = setTimeout(() => {
            if (loadingModalInstance) {
                loadingModalInstance.hide();
                showNotification('Firma detayları yüklenirken zaman aşımı oluştu. Lütfen tekrar deneyin.', 'warning');
            }
        }, 30000);
        
        try {
            // Google Maps API'sinin yüklü olduğundan emin ol
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                console.log('Google Maps API henüz yüklenmemiş, yükleniyor...');
                await loadGoogleMapsAPI();
                initMap();
            }
            
            // Firma detaylarını al
            const details = await getBusinessDetails(placeId);
            
            // Timeout'u temizle
            clearTimeout(loadingTimeout);
            
            if (!details || !details.name) {
                loadingModalInstance.hide();
                showNotification('Firma detayları alınamadı', 'danger');
                return;
            }
            
            // Mevcut detay modalını temizle
            const existingDetailsModal = document.getElementById('companyDetailsModal');
            if (existingDetailsModal) {
                const existingModalInstance = bootstrap.Modal.getInstance(existingDetailsModal);
                if (existingModalInstance) {
                    existingModalInstance.hide();
                }
                existingDetailsModal.remove();
            }
            
            // Yeni modal oluştur
            const detailsModal = document.createElement('div');
            detailsModal.className = 'modal fade';
            detailsModal.id = 'companyDetailsModal';
            detailsModal.setAttribute('tabindex', '-1');
            detailsModal.setAttribute('aria-labelledby', 'companyDetailsModalLabel');
            detailsModal.setAttribute('aria-hidden', 'true');
            
            document.body.appendChild(detailsModal);
            
            // Yıldız derecelendirmesi oluştur
            let starsHtml = '';
            if (details.rating) {
                const fullStars = Math.floor(details.rating);
                const halfStar = details.rating % 1 >= 0.5;
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
                
                starsHtml += `<span class="text-muted ms-1">(${details.user_ratings_total || 0})</span>`;
            }
            
            // Çalışma saatleri
            let hoursHtml = '';
            if (details.opening_hours && details.opening_hours.weekday_text) {
                hoursHtml = `
                    <div class="mt-4">
                        <h5 class="border-bottom pb-2">
                            <i class="bi bi-clock me-2 text-primary"></i>
                            Çalışma Saatleri
                        </h5>
                        <ul class="list-group list-group-flush">
                            ${details.opening_hours.weekday_text.map(day => `
                                <li class="list-group-item border-0 px-0 py-1">
                                    ${day}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            // Yorumlar
            let reviewsHtml = '';
            if (details.reviews && details.reviews.length > 0) {
                reviewsHtml = `
                    <div class="mt-4">
                        <h5 class="border-bottom pb-2">
                            <i class="bi bi-chat-left-text me-2 text-primary"></i>
                            Yorumlar
                        </h5>
                        <div class="reviews-container">
                            ${details.reviews.map(review => `
                                <div class="review-item card border-0 shadow-sm mb-3">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="mb-0">${review.author_name || 'Anonim'}</h6>
                                            <small class="text-muted">${new Date(review.time * 1000).toLocaleDateString('tr-TR')}</small>
                                        </div>
                                        <div class="mb-2">
                                            ${Array(5).fill(0).map((_, i) => 
                                                i < review.rating 
                                                    ? '<i class="bi bi-star-fill text-warning"></i>' 
                                                    : '<i class="bi bi-star text-warning"></i>'
                                            ).join('')}
                                        </div>
                                        <p class="mb-0">${review.text || 'Yorum yok'}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Fotoğraflar
            let photosHtml = '';
            if (details.photos && details.photos.length > 0) {
                photosHtml = `
                    <div class="mt-4">
                        <h5 class="border-bottom pb-2">
                            <i class="bi bi-images me-2 text-primary"></i>
                            Fotoğraflar
                        </h5>
                        <div class="row g-2 photos-container">
                            ${details.photos.map(photo => `
                                <div class="col-md-4 col-6">
                                    <a href="${photo.url}" target="_blank" class="photo-item">
                                        <img src="${photo.url}" class="img-fluid rounded" alt="${details.name}">
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            
            // Modal içeriğini oluştur
            detailsModal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="companyDetailsModalLabel">${details.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <h5 class="border-bottom pb-2">
                                            <i class="bi bi-info-circle me-2 text-primary"></i>
                                            Firma Bilgileri
                                        </h5>
                                        <p class="mb-2">
                                            <i class="bi bi-geo-alt text-primary me-2"></i>
                                            ${details.formatted_address || 'Adres bilgisi bulunamadı'}
                                        </p>
                                        <p class="mb-2">
                                            <i class="bi bi-telephone text-primary me-2"></i>
                                            ${details.formatted_phone_number || 'Telefon bilgisi bulunamadı'}
                                        </p>
                                        <p class="mb-2">
                                            <i class="bi bi-globe text-primary me-2"></i>
                                            ${details.website ? `<a href="${details.website}" target="_blank">${details.website}</a>` : 'Web sitesi bulunamadı'}
                                        </p>
                                        <p class="mb-0">
                                            <i class="bi bi-star text-primary me-2"></i>
                                            ${starsHtml || 'Derecelendirme bilgisi bulunamadı'}
                                        </p>
                                    </div>
                                    
                                    ${hoursHtml}
                                    ${reviewsHtml}
                                    ${photosHtml}
                                </div>
                                <div class="col-md-4">
                                    <div class="card border-0 shadow-sm h-100">
                                        <div class="card-body">
                                            <h5 class="card-title border-bottom pb-2">
                                                <i class="bi bi-map me-2 text-primary"></i>
                                                Haritada Göster
                                            </h5>
                                            <a href="${details.url}" target="_blank" class="btn btn-outline-primary w-100 mt-3">
                                                <i class="bi bi-map me-1"></i> Google Maps'te Aç
                                            </a>
                                            
                                            <h5 class="card-title border-bottom pb-2 mt-4">
                                                <i class="bi bi-chat-left-text me-2 text-primary"></i>
                                                Değerlendirme Yap
                                            </h5>
                                            <div class="rating-form">
                                                <div class="rating-stars mb-3">
                                                    <span class="star" data-rating="1"><i class="bi bi-star"></i></span>
                                                    <span class="star" data-rating="2"><i class="bi bi-star"></i></span>
                                                    <span class="star" data-rating="3"><i class="bi bi-star"></i></span>
                                                    <span class="star" data-rating="4"><i class="bi bi-star"></i></span>
                                                    <span class="star" data-rating="5"><i class="bi bi-star"></i></span>
                                                    <span class="ms-2 rating-text">Puan seçin</span>
                                                </div>
                                                <div class="mb-3">
                                                    <textarea class="form-control" id="review-comment" rows="3" placeholder="Yorumunuzu yazın..."></textarea>
                                                </div>
                                                <button class="btn btn-primary" id="submit-review-btn" data-place-id="${placeId}">
                                                    <i class="bi bi-send me-1"></i> Gönder
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                            <button type="button" class="btn btn-primary save-company-btn" data-place-id="${placeId}">
                                <i class="bi bi-bookmark me-1"></i> Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Yükleme modalını kapat
            loadingModalInstance.hide();
            
            // Detay modalını göster
            const modal = new bootstrap.Modal(detailsModal);
            modal.show();
            
            // Modal kapatıldığında yükleme modalının da kapatıldığından emin ol
            detailsModal.addEventListener('hidden.bs.modal', function () {
                // Yükleme modalını kontrol et ve kapat
                const loadingModalElement = document.getElementById('loadingModal');
                if (loadingModalElement) {
                    const loadingModalInstance = bootstrap.Modal.getInstance(loadingModalElement);
                    if (loadingModalInstance) {
                        loadingModalInstance.hide();
                    }
                    loadingModalElement.remove();
                }
            });
            
            // Yıldız derecelendirme işlevselliği
            const stars = detailsModal.querySelectorAll('.rating-stars .star');
            stars.forEach(star => {
                star.addEventListener('mouseover', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    highlightStars(rating);
                });
                
                star.addEventListener('mouseout', function() {
                    resetStars();
                });
                
                star.addEventListener('click', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    setRating(rating);
                });
            });
            
            // Yorum gönderme butonu
            const submitReviewBtn = detailsModal.querySelector('#submit-review-btn');
            if (submitReviewBtn) {
                submitReviewBtn.addEventListener('click', function() {
                    submitReview(placeId);
                });
            }
            
            // Firma kaydetme butonu
            const saveCompanyBtn = detailsModal.querySelector('.save-company-btn');
            if (saveCompanyBtn) {
                saveCompanyBtn.addEventListener('click', async function() {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        
                        if (!user) {
                            showNotification('Firmayı kaydetmek için giriş yapmalısınız', 'warning');
                            return;
                        }
                        
                        const result = await saveCompanies([{
                            place_id: placeId,
                            name: details.name,
                            address: details.formatted_address,
                            phone: details.formatted_phone_number,
                            website: details.website,
                            rating: details.rating
                        }], user.id);
                        
                        if (result.success) {
                            showNotification('Firma başarıyla kaydedildi', 'success');
                            saveCompanyBtn.disabled = true;
                            saveCompanyBtn.innerHTML = '<i class="bi bi-bookmark-check me-1"></i> Kaydedildi';
                        } else {
                            showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
                        }
                    } catch (error) {
                        console.error('Firma kaydetme hatası:', error);
                        showNotification('Firma kaydedilemedi', 'danger');
                    }
                });
            }
        } catch (error) {
            // Timeout'u temizle
            clearTimeout(loadingTimeout);
            
            console.error('Firma detayları gösterme hatası:', error);
            showNotification('Firma detayları gösterilemedi: ' + error.message, 'danger');
            
            // Yükleme modalını kapat (hata durumunda)
            loadingModalInstance.hide();
        }
    } catch (error) {
        console.error('Firma detayları gösterme hatası:', error);
        showNotification('Firma detayları gösterilemedi: ' + error.message, 'danger');
        
        // Yükleme modalını kapat (hata durumunda)
        const loadingModal = document.getElementById('loadingModal');
        if (loadingModal) {
            const bsModal = bootstrap.Modal.getInstance(loadingModal);
            if (bsModal) bsModal.hide();
            loadingModal.remove();
        }
    }
}

// Yükleme Modalı Oluştur
function createLoadingModal() {
    // Mevcut bir modal varsa önce onu kaldır
    const existingModal = document.getElementById('loadingModal');
    if (existingModal) {
        const modalInstance = bootstrap.Modal.getInstance(existingModal);
        if (modalInstance) {
            modalInstance.hide();
        }
        existingModal.remove();
    }
    
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
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
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
            
            // Modalı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('companyDetailsModal'));
            if (modal) modal.hide();
            
            changeView('login');
            return;
        }
        
        // Form verilerini al
        const rating = selectedRating;
        const comment = document.getElementById('review-comment').value.trim();
        
        // Form doğrulama
        if (rating === 0) {
            showNotification('Lütfen bir derecelendirme seçin', 'warning');
            return;
        }
        
        if (!comment) {
            showNotification('Lütfen bir yorum yazın', 'warning');
            return;
        }
        
        // Yorumu gönder
        const result = await addCompanyReview(placeId, rating, comment);
        
        if (result.success) {
            showNotification('Değerlendirmeniz başarıyla eklendi', 'success');
            
            // Formu sıfırla
            resetStars();
            selectedRating = 0;
            document.getElementById('review-comment').value = '';
            
            // Modalı kapat
            const modal = bootstrap.Modal.getInstance(document.getElementById('companyDetailsModal'));
            if (modal) modal.hide();
            
            // Firma detaylarını yeniden yükle
            setTimeout(() => {
                showCompanyDetails(placeId);
            }, 500);
        } else {
            showNotification(`Değerlendirme eklenemedi: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Yorum gönderme hatası:', error);
        showNotification('Değerlendirme gönderilirken bir hata oluştu', 'danger');
    }
}

// Geçici ID'li firmalar için basit detay modalı göster
function showSimpleCompanyDetails(company) {
    // Mevcut yükleme modalını temizle
    const existingLoadingModal = document.getElementById('loadingModal');
    if (existingLoadingModal) {
        const existingModalInstance = bootstrap.Modal.getInstance(existingLoadingModal);
        if (existingModalInstance) {
            existingModalInstance.hide();
        }
        existingLoadingModal.remove();
    }
    
    try {
        if (!company || !company.name) {
            showNotification('Firma detayları gösterilemiyor', 'danger');
            return;
        }
        
        // Mevcut detay modalını temizle
        const existingDetailsModal = document.getElementById('simpleCompanyDetailsModal');
        if (existingDetailsModal) {
            const existingModalInstance = bootstrap.Modal.getInstance(existingDetailsModal);
            if (existingModalInstance) {
                existingModalInstance.hide();
            }
            existingDetailsModal.remove();
        }
        
        // Yeni modal oluştur
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal fade';
        detailsModal.id = 'simpleCompanyDetailsModal';
        detailsModal.setAttribute('tabindex', '-1');
        detailsModal.setAttribute('aria-labelledby', 'simpleCompanyDetailsModalLabel');
        detailsModal.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(detailsModal);
        
        // Yıldız derecelendirmesi oluştur
        let starsHtml = '';
        if (company.rating) {
            const fullStars = Math.floor(company.rating);
            const halfStar = company.rating % 1 >= 0.5;
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
            
            starsHtml += `<span class="text-muted ms-1">(${company.user_ratings_total || 0})</span>`;
        }
        
        // Modal içeriğini oluştur
        detailsModal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="simpleCompanyDetailsModalLabel">${company.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Kapat"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning mb-4">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Bu firma için sınırlı bilgiler gösteriliyor. Google Places API'den tam detaylar alınamadı.
                        </div>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="mb-4">
                                    <h5 class="border-bottom pb-2">
                                        <i class="bi bi-info-circle me-2 text-primary"></i>
                                        Firma Bilgileri
                                    </h5>
                                    
                                    <!-- İletişim Bilgileri -->
                                    <div class="contact-info">
                                        <!-- Adres -->
                                        <div class="info-item mb-3">
                                            <h6 class="mb-2">
                                                <i class="bi bi-geo-alt text-primary me-2"></i>
                                                Adres
                                            </h6>
                                            <div class="ps-4">
                                                <p class="mb-1">${company.formatted_address || 'Adres bilgisi bulunamadı'}</p>
                                                ${company.formatted_address ? `
                                                    <a href="https://www.google.com/maps?q=${encodeURIComponent(company.formatted_address)}" 
                                                       target="_blank" class="btn btn-sm btn-outline-primary mt-2">
                                                        <i class="bi bi-map me-1"></i> Haritada Göster
                                                    </a>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                        <!-- Telefon -->
                                        <div class="info-item mb-3">
                                            <h6 class="mb-2">
                                                <i class="bi bi-telephone text-primary me-2"></i>
                                                Telefon
                                            </h6>
                                            <div class="ps-4">
                                                ${company.formatted_phone_number ? `
                                                    <p class="mb-1">
                                                        <a href="tel:${company.formatted_phone_number.replace(/[\s\(\)\-]/g, '')}" class="text-decoration-none">
                                                            ${company.formatted_phone_number}
                                                        </a>
                                                    </p>
                                                    <div class="btn-group mt-2">
                                                        <a href="tel:${company.formatted_phone_number.replace(/[\s\(\)\-]/g, '')}" class="btn btn-sm btn-outline-primary">
                                                            <i class="bi bi-telephone me-1"></i> Ara
                                                        </a>
                                                        <a href="https://wa.me/${company.formatted_phone_number.replace(/[\s\(\)\-]/g, '')}" target="_blank" class="btn btn-sm btn-outline-success">
                                                            <i class="bi bi-whatsapp me-1"></i> WhatsApp
                                                        </a>
                                                    </div>
                                                ` : `
                                                    <p class="mb-1">Telefon bilgisi bulunamadı</p>
                                                `}
                                            </div>
                                        </div>
                                        
                                        <!-- E-posta ve Web Sitesi -->
                                        <div class="info-item mb-3">
                                            <h6 class="mb-2">
                                                <i class="bi bi-globe text-primary me-2"></i>
                                                İnternet
                                            </h6>
                                            <div class="ps-4">
                                                ${company.website ? `
                                                    <p class="mb-1">
                                                        <i class="bi bi-globe2 me-2"></i>
                                                        <a href="${company.website}" target="_blank" class="text-decoration-none">
                                                            ${new URL(company.website).hostname}
                                                        </a>
                                                    </p>
                                                ` : ''}
                                                ${company.email ? `
                                                    <p class="mb-1">
                                                        <i class="bi bi-envelope me-2"></i>
                                                        <a href="mailto:${company.email}" class="text-decoration-none">
                                                            ${company.email}
                                                        </a>
                                                    </p>
                                                ` : ''}
                                                ${!company.website && !company.email ? `
                                                    <p class="mb-1">İnternet bilgisi bulunamadı</p>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                        <!-- Değerlendirme -->
                                        <div class="info-item mb-3">
                                            <h6 class="mb-2">
                                                <i class="bi bi-star text-primary me-2"></i>
                                                Değerlendirme
                                            </h6>
                                            <div class="ps-4">
                                                <p class="mb-1">
                                                    ${starsHtml || 'Derecelendirme bilgisi bulunamadı'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card border-0 shadow-sm h-100">
                                    <div class="card-body">
                                        <h5 class="card-title border-bottom pb-2">
                                            <i class="bi bi-map me-2 text-primary"></i>
                                            Haritada Göster
                                        </h5>
                                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name)}&query_place_id=${encodeURIComponent(company.place_id)}" 
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
                        <button type="button" class="btn btn-primary save-company-btn" data-place-id="${company.place_id}">
                            <i class="bi bi-bookmark me-1"></i> Kaydet
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Modalı göster
        const modal = new bootstrap.Modal(detailsModal);
        modal.show();
        
        // Modal kapatıldığında yükleme modalının da kapatıldığından emin ol
        detailsModal.addEventListener('hidden.bs.modal', function () {
            // Yükleme modalını kontrol et ve kapat
            const loadingModalElement = document.getElementById('loadingModal');
            if (loadingModalElement) {
                const loadingModalInstance = bootstrap.Modal.getInstance(loadingModalElement);
                if (loadingModalInstance) {
                    loadingModalInstance.hide();
                }
                loadingModalElement.remove();
            }
        });
        
        // Kaydet butonuna olay dinleyicisi ekle
        const saveButton = detailsModal.querySelector('.save-company-btn');
        if (saveButton) {
            saveButton.addEventListener('click', async function() {
                const placeId = this.getAttribute('data-place-id');
                
                try {
                    // Kullanıcı oturum durumunu kontrol et
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (!user) {
                        showNotification('Firma kaydetmek için lütfen giriş yapın', 'warning');
                        modal.hide();
                        changeView('login');
                        return;
                    }
                    
                    // Firmayı kaydet
                    const result = await saveCompanies([company], user.id);
                    
                    if (result.success) {
                        showNotification('Firma başarıyla kaydedildi', 'success');
                        modal.hide();
                    } else {
                        showNotification(`Firma kaydedilemedi: ${result.error}`, 'danger');
                    }
                } catch (error) {
                    console.error('Firma kaydetme hatası:', error);
                    showNotification('Firma kaydedilemedi', 'danger');
                }
            });
        }
    } catch (error) {
        console.error('Basit firma detayları gösterme hatası:', error);
        showNotification('Firma detayları gösterilemedi: ' + error.message, 'danger');
        
        // Hata durumunda yükleme modalını kapat
        const loadingModalElement = document.getElementById('loadingModal');
        if (loadingModalElement) {
            const loadingModalInstance = bootstrap.Modal.getInstance(loadingModalElement);
            if (loadingModalInstance) {
                loadingModalInstance.hide();
            }
            loadingModalElement.remove();
        }
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

// İlk sayfayı göster
showPage(1);

// Tüm sonuçları global değişkende sakla
window.allSearchResults = validResults;

// Toplu işlem butonlarını güncelle
setTimeout(updateBulkActionButtons, 100);