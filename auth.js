// Kimlik Doğrulama İşlemleri

// Oturum Durumunu Kontrol Et
async function checkAuthState() {
    try {
        // Supabase oturum durumunu kontrol et
        const { data: { user } } = await supabase.auth.getUser();
        
        // Kullanıcı bilgilerini güncelle
        updateUserInfo(user);
        
        // Oturum değişikliklerini dinle
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            updateUserInfo(session ? session.user : null);
        });
    } catch (error) {
        console.error('Oturum durumu kontrol edilirken hata oluştu:', error);
    }
}

// Kullanıcı Bilgilerini Güncelle
function updateUserInfo(user) {
    const authButtons = document.querySelector('.auth-buttons');
    const userInfo = document.querySelector('.user-info');
    const userEmail = document.getElementById('userEmail');
    
    if (user) {
        // Kullanıcı giriş yapmış
        if (authButtons && userInfo) {
            // Giriş/kayıt butonlarını gizle
            document.getElementById('loginBtn').classList.add('d-none');
            document.getElementById('registerBtn').classList.add('d-none');
            
            // Kullanıcı bilgilerini göster
            userInfo.classList.remove('d-none');
            userEmail.textContent = user.email;
        }
        
        // Kullanıcıya özel içeriği yükle
        loadUserData(user);
    } else {
        // Kullanıcı giriş yapmamış
        if (authButtons && userInfo) {
            // Giriş/kayıt butonlarını göster
            document.getElementById('loginBtn').classList.remove('d-none');
            document.getElementById('registerBtn').classList.remove('d-none');
            
            // Kullanıcı bilgilerini gizle
            userInfo.classList.add('d-none');
        }
    }
}

// Kullanıcı Verilerini Yükle
function loadUserData(user) {
    // Son aramaları yükle
    loadRecentSearches(user);
    
    // Kaydedilen firmaları yükle
    loadSavedCompanies(user);
}

// Son Aramaları Yükle
async function loadRecentSearches(user) {
    const recentSearchesContainer = document.getElementById('recent-searches');
    
    if (!recentSearchesContainer) return;
    
    // Yükleme göstergesini göster
    recentSearchesContainer.innerHTML = '<li class="list-group-item text-center"><div class="loading-spinner mx-auto"></div></li>';
    
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
            recentSearchesContainer.innerHTML = '<li class="list-group-item">Son aramalar yüklenirken bir hata oluştu</li>';
            return;
        }
        
        if (searches.length === 0) {
            recentSearchesContainer.innerHTML = '<li class="list-group-item">Henüz arama yapmadınız</li>';
            return;
        }
        
        // Aramaları listele
        recentSearchesContainer.innerHTML = '';
        searches.forEach(search => {
            const searchItem = document.createElement('li');
            searchItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const searchInfo = document.createElement('div');
            searchInfo.innerHTML = `
                <strong>${search.query}</strong>
                <small class="d-block text-muted">${search.location}</small>
            `;
            
            const searchMeta = document.createElement('div');
            searchMeta.innerHTML = `
                <span class="badge bg-primary rounded-pill">${search.result_count} sonuç</span>
                <small class="d-block text-muted">${formatDate(search.created_at)}</small>
            `;
            
            searchItem.appendChild(searchInfo);
            searchItem.appendChild(searchMeta);
            
            // Arama öğesine tıklandığında arama sayfasına yönlendir
            searchItem.style.cursor = 'pointer';
            searchItem.addEventListener('click', () => {
                // Arama formunu doldur
                document.getElementById('business-type').value = search.query;
                document.getElementById('location').value = search.location;
                
                // Arama sayfasına git
                changeView('search');
                
                // Aramayı otomatik olarak başlat
                setTimeout(() => {
                    const searchForm = document.getElementById('search-form');
                    if (searchForm) {
                        searchForm.dispatchEvent(new Event('submit'));
                    } else {
                        console.error('Arama formu bulunamadı');
                    }
                }, 500);
            });
            
            recentSearchesContainer.appendChild(searchItem);
        });
    } catch (error) {
        console.error('Son aramalar yüklenirken bir hata oluştu:', error);
        recentSearchesContainer.innerHTML = '<li class="list-group-item">Son aramalar yüklenirken bir hata oluştu</li>';
    }
}

// Kaydedilen Firmaları Yükle
async function loadSavedCompanies(user) {
    const savedCompaniesContainer = document.getElementById('saved-companies');
    
    if (!savedCompaniesContainer) return;
    
    // Yükleme göstergesini göster
    savedCompaniesContainer.innerHTML = '<p class="text-center"><div class="loading-spinner mx-auto"></div></p>';
    
    try {
        // Kaydedilen firmaları veritabanından çek
        const { data: companies, error } = await supabase
            .from('saved_companies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Kaydedilen firmalar yüklenemedi:', error);
            savedCompaniesContainer.innerHTML = '<p class="text-center text-muted">Kaydedilen firmalar yüklenirken bir hata oluştu</p>';
            return;
        }
        
        if (companies.length === 0) {
            savedCompaniesContainer.innerHTML = '<p class="text-center text-muted">Henüz kaydedilmiş firma bulunmuyor</p>';
            return;
        }
        
        // Firmaları listele
        savedCompaniesContainer.innerHTML = '';
        companies.forEach(company => {
            const companyElement = document.createElement('div');
            companyElement.className = 'company-item';
            companyElement.dataset.id = company.id;
            
            // Yıldız gösterimi oluştur
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(company.rating)) {
                    starsHtml += '<i class="bi bi-star-fill"></i> ';
                } else if (i - 0.5 <= company.rating) {
                    starsHtml += '<i class="bi bi-star-half"></i> ';
                } else {
                    starsHtml += '<i class="bi bi-star"></i> ';
                }
            }
            
            companyElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <div class="company-name">${company.name}</div>
                        <div class="company-address">${company.address}</div>
                        <div class="company-contact">
                            <span><i class="bi bi-telephone"></i> ${company.phone || 'Belirtilmemiş'}</span>
                            <span><i class="bi bi-globe"></i> ${company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : 'Belirtilmemiş'}</span>
                        </div>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input company-checkbox" type="checkbox" value="${company.id}">
                    </div>
                </div>
                <div class="mt-2">
                    <span class="company-rating">${starsHtml}</span>
                    <small class="text-muted">(${company.reviews || 0} değerlendirme)</small>
                </div>
            `;
            
            savedCompaniesContainer.appendChild(companyElement);
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
        savedCompaniesContainer.innerHTML = '<p class="text-center text-muted">Kaydedilen firmalar yüklenirken bir hata oluştu</p>';
    }
}

// Giriş İşlemi
async function handleLogin(e) {
    e.preventDefault();
    
    // Form verilerini al
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Form doğrulama
    if (!email || !password) {
        showNotification('Lütfen e-posta ve şifre girin', 'danger');
        return;
    }
    
    try {
        // Yükleme göstergesini göster
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Giriş yapılıyor...';
        
        // Giriş işlemi
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Giriş başarılı
        showNotification('Giriş başarılı', 'success');
        
        // Ana sayfaya yönlendir
        changeView('dashboard');
    } catch (error) {
        console.error('Giriş yapılamadı:', error);
        
        // Özel hata mesajları
        let errorMessage = error.message;
        let errorType = 'danger';
        
        if (error.message.includes("Email not confirmed")) {
            errorMessage = "E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin ve gönderilen doğrulama bağlantısına tıklayın.";
            
            // Doğrulama e-postasını yeniden gönderme butonu ekle
            setTimeout(() => {
                const resendButton = document.createElement('button');
                resendButton.className = 'btn btn-sm btn-primary mt-2';
                resendButton.innerHTML = 'Doğrulama E-postasını Yeniden Gönder';
                resendButton.onclick = async () => {
                    try {
                        const { error } = await supabase.auth.resend({
                            type: 'signup',
                            email: email,
                            options: {
                                emailRedirectTo: window.location.origin
                            }
                        });
                        
                        if (error) throw error;
                        
                        showNotification('Doğrulama e-postası yeniden gönderildi. Lütfen e-posta kutunuzu kontrol edin.', 'success');
                    } catch (err) {
                        showNotification('E-posta gönderilemedi: ' + err.message, 'danger');
                    }
                };
                
                // Bildirim alanına butonu ekle
                const notificationArea = document.querySelector('.notification-area');
                if (notificationArea) {
                    notificationArea.appendChild(resendButton);
                }
            }, 500);
        } else if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin.";
        }
        
        showNotification('Giriş yapılamadı: ' + errorMessage, errorType);
    } finally {
        // Butonu eski haline getir
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Giriş Yap';
    }
}

// Kayıt İşlemi
async function handleRegister(e) {
    e.preventDefault();
    
    // Form verilerini al
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    
    // Form doğrulama
    if (!email || !password || !passwordConfirm) {
        showNotification('Lütfen tüm alanları doldurun', 'danger');
        return;
    }
    
    if (password !== passwordConfirm) {
        showNotification('Şifreler eşleşmiyor', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Şifre en az 6 karakter olmalıdır', 'danger');
        return;
    }
    
    try {
        // Yükleme göstergesini göster
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Kayıt yapılıyor...';
        
        // Geliştirme ortamında e-posta doğrulamasını atla seçeneği
        const skipEmailVerification = document.getElementById('skip-email-verification')?.checked || false;
        
        // Kayıt işlemi
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    full_name: email.split('@')[0]
                }
            }
        });
        
        if (error) throw error;
        
        // Kayıt başarılı
        if (skipEmailVerification) {
            // Geliştirme ortamında doğrudan giriş yap
            showNotification('Kayıt başarılı! E-posta doğrulaması atlandı.', 'success');
            
            // Otomatik giriş yap
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (loginError) {
                console.error('Otomatik giriş yapılamadı:', loginError);
                changeView('login');
            } else {
                changeView('dashboard');
            }
        } else {
            // Normal kayıt süreci
            showNotification('Kayıt başarılı! E-posta adresinize gönderilen onay bağlantısını kontrol edin.', 'success');
            
            // Giriş sayfasına yönlendir
            changeView('login');
        }
    } catch (error) {
        console.error('Kayıt yapılamadı:', error);
        
        // Özel hata mesajları
        let errorMessage = error.message;
        
        if (error.message.includes("Email address") && error.message.includes("is invalid")) {
            errorMessage = "Lütfen geçerli bir e-posta adresi girin. Test e-postaları (test@gmail.com gibi) kabul edilmeyebilir. Gerçek bir e-posta adresi kullanın.";
        } else if (error.message.includes("User already registered")) {
            errorMessage = "Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya farklı bir e-posta adresi kullanın.";
        }
        
        showNotification('Kayıt yapılamadı: ' + errorMessage, 'danger');
    } finally {
        // Butonu eski haline getir
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Kayıt Ol';
    }
}

// Şifremi Unuttum İşlemi
async function handleForgotPassword() {
    // E-posta adresini al
    const email = prompt('Şifre sıfırlama bağlantısı için e-posta adresinizi girin:');
    
    if (!email) return;
    
    try {
        // Şifre sıfırlama e-postası gönder
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        
        if (error) throw error;
        
        showNotification('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi', 'success');
    } catch (error) {
        console.error('Şifre sıfırlama e-postası gönderilemedi:', error);
        showNotification('Şifre sıfırlama e-postası gönderilemedi: ' + error.message, 'danger');
    }
}

// Çıkış İşlemi
async function handleLogout() {
    try {
        // Çıkış işlemi öncesi kullanıcıya bildirim göster
        showNotification('Çıkış yapılıyor...', 'info');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        // Kullanıcı arayüzünü güncelle
        const authButtons = document.querySelector('.auth-buttons');
        const userInfo = document.querySelector('.user-info');
        
        if (authButtons && userInfo) {
            // Giriş/kayıt butonlarını göster
            document.getElementById('loginBtn').classList.remove('d-none');
            document.getElementById('registerBtn').classList.remove('d-none');
            
            // Kullanıcı bilgilerini gizle
            userInfo.classList.add('d-none');
        }
        
        // Çıkış başarılı
        showNotification('Çıkış başarılı', 'success');
        
        // Ana sayfaya yönlendir
        changeView('dashboard');
        
        // Sayfayı yenile (opsiyonel)
        // window.location.reload();
    } catch (error) {
        console.error('Çıkış yapılamadı:', error);
        showNotification('Çıkış yapılamadı: ' + error.message, 'danger');
    }
}

// Olay Dinleyicilerini Ekle
document.addEventListener('DOMContentLoaded', () => {
    // Şifremi Unuttum Bağlantısı
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }
});

// Tarih Formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 