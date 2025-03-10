// Kullanıcı Arayüzü İşlemleri

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Tümünü Seç Butonları
    setupSelectAllButtons();
    
    // Kaydedilen Firmaları Silme
    setupDeleteButtons();
    
    // Kaydedilen Firmalara E-posta Gönderme
    setupSavedEmailButton();
    
    // Arama Formunu Ayarla
    setupSearchForm();
    
    // E-posta Gönderme Butonu
    const sendEmailSubmit = document.getElementById('send-email-submit');
    if (sendEmailSubmit) {
        sendEmailSubmit.addEventListener('click', handleEmailSend);
    }
});

// Tümünü Seç Butonlarını Ayarla
function setupSelectAllButtons() {
    // Arama Sonuçları Tümünü Seç Butonu
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#search-results .company-checkbox');
            
            // Eğer hiç firma yoksa uyarı göster
            if (checkboxes.length === 0) {
                showNotification('Seçilebilecek firma bulunamadı. Lütfen önce bir arama yapın.', 'warning');
                return;
            }
            
            const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            selectAllBtn.innerHTML = allChecked ? 
                '<i class="bi bi-check-all me-1"></i> Tümünü Seç' : 
                '<i class="bi bi-x-lg me-1"></i> Seçimi Kaldır';
                
            // WhatsApp ve E-posta butonlarını güncelle
            updateBulkActionButtons();
        });
    }
    
    // Kaydedilen Firmalar Tümünü Seç Butonu
    const savedSelectAllBtn = document.getElementById('saved-select-all-btn');
    if (savedSelectAllBtn) {
        savedSelectAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#saved-companies .company-checkbox');
            
            // Eğer hiç firma yoksa uyarı göster
            if (checkboxes.length === 0) {
                showNotification('Seçilebilecek kaydedilmiş firma bulunamadı.', 'warning');
                return;
            }
            
            const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            savedSelectAllBtn.innerHTML = allChecked ? 
                '<i class="bi bi-check-all me-1"></i> Tümünü Seç' : 
                '<i class="bi bi-x-lg me-1"></i> Seçimi Kaldır';
        });
    }
}

// Silme Butonlarını Ayarla
function setupDeleteButtons() {
    const deleteBtn = document.getElementById('saved-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const selectedCompanies = getSelectedCompanies('saved-companies');
            
            if (selectedCompanies.length === 0) {
                showNotification('Lütfen silmek için en az bir firma seçin', 'danger');
                return;
            }
            
            // Silme onayı
            if (confirm(`${selectedCompanies.length} firmayı silmek istediğinize emin misiniz?`)) {
                // Kullanıcı oturum açmışsa firmaları sil
                const user = supabase.auth.user();
                if (user) {
                    // Silme işlemi
                    deleteCompanies(selectedCompanies, user.id)
                        .then(response => {
                            if (response.success) {
                                showNotification(`${response.deletedCount} firma başarıyla silindi`);
                                
                                // Kaydedilen firmaları yeniden yükle
                                loadSavedCompanies(user);
                            } else {
                                showNotification('Firmalar silinirken bir hata oluştu: ' + response.error, 'danger');
                            }
                        });
                }
            }
        });
    }
}

// Kaydedilen Firmalara E-posta Gönderme Butonunu Ayarla
function setupSavedEmailButton() {
    const savedSendEmailBtn = document.getElementById('saved-send-email-btn');
    if (savedSendEmailBtn) {
        savedSendEmailBtn.addEventListener('click', () => {
            const selectedCompanies = getSelectedCompanies('saved-companies');
            
            if (selectedCompanies.length === 0) {
                showNotification('Lütfen e-posta göndermek için en az bir firma seçin', 'danger');
                return;
            }
            
            // E-posta modalını göster
            const emailModal = new bootstrap.Modal(document.getElementById('emailModal'));
            
            // Alıcıları güncelle
            updateEmailRecipients(selectedCompanies, 'saved-companies');
            
            emailModal.show();
        });
    }
}

// Arama Formunu Ayarla
function setupSearchForm() {
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Form verilerini al
            const businessType = document.getElementById('business-type')?.value || '';
            const location = document.getElementById('location')?.value || '';
            
            // Opsiyonel elementler için kontrol ekliyoruz
            const ratingElement = document.getElementById('rating');
            const hasWebsiteElement = document.getElementById('has-website');
            const hasPhoneElement = document.getElementById('has-phone');
            
            const rating = ratingElement ? ratingElement.value : '';
            const hasWebsite = hasWebsiteElement ? hasWebsiteElement.checked : false;
            const hasPhone = hasPhoneElement ? hasPhoneElement.checked : false;
            
            // Form doğrulama
            if (!businessType || !location) {
                showNotification('Lütfen firma türü ve konum bilgilerini girin', 'danger');
                return;
            }
            
            // Arama sonuçları konteynerini al
            const resultsContainer = document.getElementById('search-results');
            
            // Yükleme göstergesini göster
            showLoading(resultsContainer);
            
            try {
                // Arama işlemi
                const filters = {
                    rating: rating,
                    hasWebsite: hasWebsite,
                    hasPhone: hasPhone
                };
                
                const results = await searchBusinesses(businessType, location, filters);
                
                // Yükleme göstergesini gizle
                hideLoading(resultsContainer);
                
                // Sonuçları göster
                displayApiSearchResults(results);
                
                // Sonuç sayısını göster
                showNotification(`${results.length} firma bulundu`);
            } catch (error) {
                // Yükleme göstergesini gizle
                hideLoading(resultsContainer);
                
                console.error('Arama hatası:', error);
                showNotification('Arama sırasında bir hata oluştu: ' + error.message, 'danger');
                
                // Hata mesajını göster
                resultsContainer.innerHTML = `<p class="text-center text-danger">Arama sırasında bir hata oluştu: ${error.message}</p>`;
            }
        });
    }
}

// E-posta Alıcılarını Güncelle
function updateEmailRecipients(selectedCompanyIds, containerId = 'search-results') {
    const recipientsContainer = document.getElementById('email-recipients');
    if (!recipientsContainer) return;
    
    // Seçili firmaları bul
    const companies = [];
    selectedCompanyIds.forEach(id => {
        const companyElement = document.querySelector(`#${containerId} .company-item[data-id="${id}"]`);
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
        badge.className = 'badge bg-primary me-2 mb-2';
        badge.textContent = company.name;
        recipientsContainer.appendChild(badge);
    });
}

// Seçili Firmaları Al (Belirli Bir Konteynerden)
function getSelectedCompanies(containerId = 'search-results') {
    const checkboxes = document.querySelectorAll(`#${containerId} .company-checkbox:checked`);
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

// Arama Sonuçlarını Göster (API'den Gelen Verilerle)
function displayApiSearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    // Konteyner içeriğini temizle
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center text-muted">Arama kriterlerinize uygun sonuç bulunamadı</p>';
        return;
    }
    
    // Filtreleme bölümünü göster
    const filterSection = document.getElementById('filter-section');
    if (filterSection) {
        filterSection.classList.remove('d-none');
    }
    
    // Sonuçları listele
    const resultsList = document.createElement('div');
    resultsList.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
    
    // Sonuçları gruplar halinde ekle (lazy loading)
    const BATCH_SIZE = 10;
    let currentIndex = 0;
    
    function addNextBatch() {
        const fragment = document.createDocumentFragment();
        const endIndex = Math.min(currentIndex + BATCH_SIZE, results.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
            const company = results[i];
            const companyCard = createCompanyCard(company);
            fragment.appendChild(companyCard);
        }
        
        resultsList.appendChild(fragment);
        currentIndex = endIndex;
        
        // Daha fazla sonuç varsa "Daha Fazla" butonu göster
        if (currentIndex < results.length) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.className = 'text-center mt-4';
            loadMoreBtn.innerHTML = `
                <button class="btn btn-outline-primary load-more-btn">
                    <i class="bi bi-plus-circle me-2"></i>Daha Fazla Göster (${results.length - currentIndex})
                </button>
            `;
            loadMoreBtn.querySelector('.load-more-btn').addEventListener('click', () => {
                loadMoreBtn.remove();
                addNextBatch();
            });
            resultsList.after(loadMoreBtn);
        }
    }
    
    resultsContainer.appendChild(resultsList);
    addNextBatch();
}

// Firma kartı oluştur
function createCompanyCard(company) {
    const col = document.createElement('div');
    col.className = 'col';
    
    // Yıldız gösterimi oluştur
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(company.rating)) {
            starsHtml += '<i class="bi bi-star-fill text-warning"></i> ';
        } else if (i - 0.5 <= company.rating) {
            starsHtml += '<i class="bi bi-star-half text-warning"></i> ';
        } else {
            starsHtml += '<i class="bi bi-star text-warning"></i> ';
        }
    }
    
    // Telefon numarası kontrolü
    const hasPhone = company.formatted_phone_number || company.phone;
    const phoneDisplay = hasPhone ? (company.formatted_phone_number || company.phone) : 'Telefon belirtilmemiş';
    
    // Web sitesi kontrolü
    const hasWebsite = company.website;
    const websiteDisplay = hasWebsite ? 
        `<a href="${company.website}" target="_blank" class="text-primary">${company.website}</a>` : 
        'Web sitesi belirtilmemiş';
    
    // WhatsApp butonu (telefon varsa göster)
    const whatsappButton = hasPhone ? 
        `<button class="btn btn-sm btn-success whatsapp-btn" data-phone="${hasPhone}" data-company="${company.name}">
            <i class="bi bi-whatsapp"></i> WhatsApp
        </button>` : '';
    
    col.innerHTML = `
        <div class="card h-100 company-card shadow-sm hover-effect company-item" data-id="${company.place_id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title company-name">${company.name}</h5>
                        <p class="card-text company-address text-muted mb-2">
                            <i class="bi bi-geo-alt"></i> ${company.formatted_address || company.vicinity || 'Adres belirtilmemiş'}
                        </p>
                        <div class="company-contact mb-2">
                            <p class="mb-1"><i class="bi bi-telephone"></i> ${phoneDisplay}</p>
                            <p class="mb-1"><i class="bi bi-globe"></i> ${websiteDisplay}</p>
                        </div>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input company-checkbox" type="checkbox" value="${company.place_id}">
                    </div>
                </div>
                <div class="mt-2">
                    <span class="company-rating">${starsHtml}</span>
                    <small class="text-muted">(${company.user_ratings_total || 0} değerlendirme)</small>
                </div>
                <div class="mt-3 d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary view-details-btn flex-grow-1" data-place-id="${company.place_id}">
                        <i class="bi bi-info-circle"></i> Detaylar
                    </button>
                    ${whatsappButton}
                    <button class="btn btn-sm btn-outline-success save-company-btn" data-place-id="${company.place_id}">
                        <i class="bi bi-bookmark"></i> Kaydet
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Detay butonu olayı
    const detailBtn = col.querySelector('.view-details-btn');
    detailBtn.addEventListener('click', () => {
        showCompanyDetails(company.place_id);
    });
    
    // WhatsApp butonu olayı
    const whatsappBtn = col.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const phone = whatsappBtn.getAttribute('data-phone');
            const companyName = whatsappBtn.getAttribute('data-company');
            sendWhatsAppFromDetails(phone, companyName);
        });
    }
    
    // Kaydet butonu olayı
    const saveBtn = col.querySelector('.save-company-btn');
    saveBtn.addEventListener('click', async () => {
        try {
            // Kullanıcı kontrolü
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showNotification('Firma kaydetmek için giriş yapmalısınız', 'warning');
                return;
            }
            
            // Firma bilgilerini hazırla
            const companyData = {
                place_id: company.place_id,
                name: company.name,
                address: company.formatted_address || company.vicinity || '',
                phone: company.formatted_phone_number || company.phone || '',
                website: company.website || '',
                rating: company.rating || 0,
                reviews: company.user_ratings_total || 0
            };
            
            // Firmayı kaydet
            const result = await saveCompanies([companyData], user.id);
            
            if (result.success) {
                showNotification('Firma başarıyla kaydedildi', 'success');
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="bi bi-bookmark-check"></i> Kaydedildi';
            } else {
                showNotification('Firma kaydedilemedi: ' + result.error, 'danger');
            }
        } catch (error) {
            console.error('Firma kaydedilemedi:', error);
            showNotification('Firma kaydedilemedi: ' + error.message, 'danger');
        }
    });
    
    return col;
}

// Firma Detaylarını Göster
function displayBusinessDetails(business) {
    // Eğer business null ise veya id yoksa hata göster
    if (!business || !business.id) {
        showNotification('Firma detayları alınamadı', 'danger');
        return;
    }
    
    // Modal oluştur
    const modalId = 'businessDetailModal';
    let modal = document.getElementById(modalId);
    
    // Eğer modal yoksa oluştur
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = '-1';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">Firma Detayları</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div id="business-detail-content">
                            <div class="text-center p-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Yükleniyor...</span>
                                </div>
                                <p class="mt-2">Firma detayları yükleniyor...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Kapat</button>
                        <button type="button" class="btn btn-primary" id="save-business-btn">Firmayı Kaydet</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Modal'ı göster
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Modal içeriğini güncelle
    const contentContainer = document.getElementById('business-detail-content');
    
    // Yükleme göstergesini göster
    contentContainer.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Yükleniyor...</span>
            </div>
            <p class="mt-2">Firma detayları yükleniyor...</p>
        </div>
    `;
    
    // Detayları asenkron olarak yükle
    setTimeout(() => {
        // Yıldız gösterimi oluştur
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(business.rating)) {
                starsHtml += '<i class="bi bi-star-fill text-warning"></i> ';
            } else if (i - 0.5 <= business.rating) {
                starsHtml += '<i class="bi bi-star-half text-warning"></i> ';
            } else {
                starsHtml += '<i class="bi bi-star text-warning"></i> ';
            }
        }
        
        // Fotoğraf galerisi oluştur
        let photosHtml = '';
        if (business.photos && business.photos.length > 0) {
            photosHtml = `
                <div class="business-photos mb-4">
                    <h5 class="border-bottom pb-2 mb-3">Fotoğraflar</h5>
                    <div id="businessPhotosCarousel" class="carousel slide" data-bs-ride="carousel">
                        <div class="carousel-inner">
                            ${business.photos.map((photo, index) => `
                                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                                    <img src="${photo.url}" class="d-block w-100 rounded" alt="${business.name}" loading="lazy">
                                </div>
                            `).join('')}
                        </div>
                        <button class="carousel-control-prev" type="button" data-bs-target="#businessPhotosCarousel" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Önceki</span>
                        </button>
                        <button class="carousel-control-next" type="button" data-bs-target="#businessPhotosCarousel" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Sonraki</span>
                        </button>
                    </div>
                </div>
            `;
        }
        
        // Çalışma saatleri oluştur
        let hoursHtml = '';
        if (business.opening_hours && business.opening_hours.length > 0) {
            hoursHtml = `
                <div class="business-hours mb-4">
                    <h5 class="border-bottom pb-2 mb-3">Çalışma Saatleri</h5>
                    <ul class="list-group">
                        ${business.opening_hours.map(day => `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <span>${day.split(': ')[0]}</span>
                                <span class="badge bg-primary rounded-pill">${day.split(': ')[1]}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Tür bilgilerini oluştur
        let typesHtml = '';
        if (business.types && business.types.length > 0) {
            typesHtml = `
                <div class="business-types mb-4">
                    <h5 class="border-bottom pb-2 mb-3">Kategoriler</h5>
                    <div class="d-flex flex-wrap gap-2">
                        ${business.types.map(type => `
                            <span class="badge bg-secondary">${type}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Yorumları oluştur
        let reviewsHtml = '';
        if (business.reviews && business.reviews.length > 0) {
            reviewsHtml = `
                <div class="business-reviews mb-4">
                    <h5 class="border-bottom pb-2 mb-3">Değerlendirmeler</h5>
                    <div class="reviews-container">
                        ${business.reviews.map(review => {
                            // Yıldız gösterimi oluştur
                            let reviewStars = '';
                            for (let i = 1; i <= 5; i++) {
                                if (i <= review.rating) {
                                    reviewStars += '<i class="bi bi-star-fill text-warning"></i> ';
                                } else {
                                    reviewStars += '<i class="bi bi-star text-warning"></i> ';
                                }
                            }
                            
                            return `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-2">
                                            <img src="${review.profile_photo_url || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" width="40" height="40" alt="${review.author}" loading="lazy">
                                            <div>
                                                <h6 class="mb-0">${review.author}</h6>
                                                <small class="text-muted">${review.date}</small>
                                            </div>
                                        </div>
                                        <div class="mb-2">${reviewStars}</div>
                                        <p class="card-text">${review.comment}</p>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // Yorum ekleme formu
        const reviewFormHtml = `
            <div class="business-review-form mb-4">
                <h5 class="border-bottom pb-2 mb-3">Değerlendirme Ekle</h5>
                <form id="review-form">
                    <input type="hidden" id="review-place-id" value="${business.id}">
                    <div class="mb-3">
                        <label for="review-rating" class="form-label">Puanınız</label>
                        <div class="rating-stars">
                            <i class="bi bi-star fs-4 rating-star" data-rating="1"></i>
                            <i class="bi bi-star fs-4 rating-star" data-rating="2"></i>
                            <i class="bi bi-star fs-4 rating-star" data-rating="3"></i>
                            <i class="bi bi-star fs-4 rating-star" data-rating="4"></i>
                            <i class="bi bi-star fs-4 rating-star" data-rating="5"></i>
                            <input type="hidden" id="review-rating" value="0">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="review-comment" class="form-label">Yorumunuz</label>
                        <textarea class="form-control" id="review-comment" rows="3" placeholder="Bu işletme hakkında düşüncelerinizi paylaşın..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Değerlendirme Gönder</button>
                </form>
            </div>
        `;
        
        // İçeriği oluştur
        contentContainer.innerHTML = `
            <div class="business-detail-header p-4 bg-light">
                <div class="row">
                    <div class="col-md-8">
                        <h3 class="mb-2">${business.name}</h3>
                        <p class="mb-2 text-muted">
                            <i class="bi bi-geo-alt"></i> ${business.address}
                        </p>
                        <div class="mb-2">
                            ${starsHtml} <span class="text-muted">(${business.reviews_count} değerlendirme)</span>
                        </div>
                        <div class="business-contact mb-2">
                            ${business.phone ? `<p class="mb-1"><i class="bi bi-telephone"></i> ${business.phone}</p>` : ''}
                            ${business.website ? `<p class="mb-1"><i class="bi bi-globe"></i> <a href="${business.website}" target="_blank" class="text-primary">${business.website}</a></p>` : ''}
                        </div>
                        ${business.url ? `<a href="${business.url}" target="_blank" class="btn btn-sm btn-outline-primary mt-2">Google Maps'te Görüntüle</a>` : ''}
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="d-flex justify-content-end">
                            <button class="btn btn-outline-primary me-2" id="share-business-btn">
                                <i class="bi bi-share"></i> Paylaş
                            </button>
                            <button class="btn btn-outline-success" id="directions-btn">
                                <i class="bi bi-map"></i> Yol Tarifi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="business-detail-content p-4">
                ${photosHtml}
                
                <div class="row">
                    <div class="col-md-6">
                        ${hoursHtml}
                        ${typesHtml}
                    </div>
                    <div class="col-md-6">
                        ${reviewsHtml}
                    </div>
                </div>
                
                ${reviewFormHtml}
            </div>
        `;
        
        // Yıldız derecelendirme işlevselliği
        const ratingStars = contentContainer.querySelectorAll('.rating-star');
        const ratingInput = contentContainer.querySelector('#review-rating');
        
        ratingStars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.dataset.rating);
                
                // Yıldızları güncelle
                ratingStars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('bi-star');
                        s.classList.add('bi-star-fill', 'text-warning');
                    } else {
                        s.classList.remove('bi-star-fill', 'text-warning');
                        s.classList.add('bi-star');
                    }
                });
            });
            
            star.addEventListener('mouseout', () => {
                const currentRating = parseInt(ratingInput.value);
                
                // Yıldızları güncelle
                ratingStars.forEach((s, index) => {
                    if (index < currentRating) {
                        s.classList.remove('bi-star');
                        s.classList.add('bi-star-fill', 'text-warning');
                    } else {
                        s.classList.remove('bi-star-fill', 'text-warning');
                        s.classList.add('bi-star');
                    }
                });
            });
            
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                ratingInput.value = rating;
                
                // Yıldızları güncelle
                ratingStars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.remove('bi-star');
                        s.classList.add('bi-star-fill', 'text-warning');
                    } else {
                        s.classList.remove('bi-star-fill', 'text-warning');
                        s.classList.add('bi-star');
                    }
                });
            });
        });
        
        // Değerlendirme formu gönderimi
        const reviewForm = contentContainer.querySelector('#review-form');
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const placeId = document.getElementById('review-place-id').value;
            const rating = parseInt(document.getElementById('review-rating').value);
            const comment = document.getElementById('review-comment').value;
            
            if (rating === 0) {
                showNotification('Lütfen bir derecelendirme seçin', 'warning');
                return;
            }
            
            if (!comment.trim()) {
                showNotification('Lütfen bir yorum yazın', 'warning');
                return;
            }
            
            try {
                // Kullanıcı kontrolü
                const user = firebase.auth().currentUser;
                if (!user) {
                    showNotification('Değerlendirme yapmak için giriş yapmalısınız', 'warning');
                    return;
                }
                
                // Değerlendirme ekle
                await addCompanyReview(placeId, rating, comment);
                
                // Formu sıfırla
                document.getElementById('review-rating').value = 0;
                document.getElementById('review-comment').value = '';
                
                // Yıldızları sıfırla
                ratingStars.forEach(s => {
                    s.classList.remove('bi-star-fill', 'text-warning');
                    s.classList.add('bi-star');
                });
                
                showNotification('Değerlendirmeniz başarıyla eklendi', 'success');
                
                // İşletme detaylarını yeniden yükle
                const updatedBusiness = await getBusinessDetails(placeId);
                displayBusinessDetails(updatedBusiness);
            } catch (error) {
                console.error('Değerlendirme eklenirken hata oluştu:', error);
                showNotification('Değerlendirme eklenirken bir hata oluştu: ' + error.message, 'danger');
            }
        });
        
        // Firmayı kaydet butonu
        const saveBusinessBtn = document.getElementById('save-business-btn');
        saveBusinessBtn.addEventListener('click', async () => {
            try {
                // Kullanıcı kontrolü
                const user = firebase.auth().currentUser;
                if (!user) {
                    showNotification('Firma kaydetmek için giriş yapmalısınız', 'warning');
                    return;
                }
                
                // Firmayı kaydet
                await saveCompanies([business], user.uid);
                
                showNotification('Firma başarıyla kaydedildi', 'success');
            } catch (error) {
                console.error('Firma kaydedilirken hata oluştu:', error);
                showNotification('Firma kaydedilemedi: ' + error.message, 'danger');
            }
        });
        
        // Paylaş butonu
        const shareBusinessBtn = document.getElementById('share-business-btn');
        shareBusinessBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: business.name,
                    text: `${business.name} - ${business.address}`,
                    url: business.url || window.location.href
                })
                .catch(error => console.error('Paylaşım hatası:', error));
            } else {
                // Paylaşım API'si desteklenmiyorsa URL'yi kopyala
                const tempInput = document.createElement('input');
                document.body.appendChild(tempInput);
                tempInput.value = business.url || window.location.href;
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                showNotification('Bağlantı panoya kopyalandı', 'success');
            }
        });
        
        // Yol tarifi butonu
        const directionsBtn = document.getElementById('directions-btn');
        directionsBtn.addEventListener('click', () => {
            if (business.url) {
                window.open(business.url, '_blank');
            } else if (business.location) {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${business.location.lat()},${business.location.lng()}&destination_place_id=${business.id}`;
                window.open(url, '_blank');
            } else {
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ' ' + business.address)}`;
                window.open(url, '_blank');
            }
        });
    }, 100); // Kısa bir gecikme ile içeriği yükle
}

// Arama Formunu Güncelle
function updateSearchForm(query, location) {
    const businessTypeInput = document.getElementById('business-type');
    const locationInput = document.getElementById('location');
    
    if (businessTypeInput && query) {
        businessTypeInput.value = query;
    }
    
    if (locationInput && location) {
        locationInput.value = location;
    }
}

// Arama Sonuçlarını Filtrele
function filterSearchResults(filters) {
    const resultsContainer = document.getElementById('search-results');
    const companyItems = resultsContainer.querySelectorAll('.company-item');
    
    companyItems.forEach(item => {
        let visible = true;
        
        // Minimum değerlendirme puanına göre filtrele
        if (filters.rating) {
            const ratingText = item.querySelector('.company-rating').textContent;
            const rating = parseFloat(ratingText);
            if (rating < parseFloat(filters.rating)) {
                visible = false;
            }
        }
        
        // Web sitesi olanlara göre filtrele
        if (filters.hasWebsite) {
            const website = item.querySelector('.company-contact a');
            if (!website) {
                visible = false;
            }
        }
        
        // Telefonu olanlara göre filtrele
        if (filters.hasPhone) {
            const phone = item.querySelector('.company-contact span:first-child').textContent;
            if (phone.includes('Belirtilmemiş')) {
                visible = false;
            }
        }
        
        // Görünürlüğü güncelle
        item.style.display = visible ? 'block' : 'none';
    });
    
    // Görünür sonuç sayısını kontrol et
    const visibleResults = resultsContainer.querySelectorAll('.company-item[style="display: block"]');
    if (visibleResults.length === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.className = 'text-center text-muted mt-3';
        noResultsMessage.id = 'no-results-message';
        noResultsMessage.textContent = 'Filtreleme kriterlerinize uygun sonuç bulunamadı';
        
        // Eğer mesaj zaten varsa ekleme
        if (!document.getElementById('no-results-message')) {
            resultsContainer.appendChild(noResultsMessage);
        }
    } else {
        // Mesaj varsa kaldır
        const noResultsMessage = document.getElementById('no-results-message');
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }
}

// E-posta Gönderme İşlemi
async function handleEmailSend() {
    try {
        // E-posta formu verilerini al
        const subject = document.getElementById('email-subject').value;
        let content = '';
        
        // Quill editörü kullanılıyorsa
        if (quillEditor) {
            content = quillEditor.root.innerHTML;
        } else {
            // Editör yüklenmediyse
            showNotification('Editör yüklenemedi, lütfen sayfayı yenileyin', 'danger');
            return;
        }
        
        // Form doğrulama
        if (!subject || !content) {
            showNotification('Lütfen e-posta konusu ve içeriğini girin', 'danger');
            return;
        }
        
        // Seçili firmaları al
        const selectedCompanyIds = getSelectedCompanies();
        
        if (selectedCompanyIds.length === 0) {
            showNotification('Lütfen en az bir firma seçin', 'danger');
            return;
        }
        
        // Gönderim butonunu devre dışı bırak
        const sendButton = document.getElementById('send-email-submit');
        const originalButtonText = sendButton.textContent;
        sendButton.disabled = true;
        sendButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gönderiliyor...';
        
        // Alıcıları hazırla (gerçek bir uygulamada e-posta adresleri olacak)
        const recipients = selectedCompanyIds.map(id => {
            // Firma bilgilerini bul
            const companyElement = document.querySelector(`.company-item[data-id="${id}"]`);
            const companyName = companyElement ? companyElement.querySelector('.company-name').textContent : 'Bilinmeyen Firma';
            const companyAddress = companyElement ? companyElement.querySelector('.company-address').textContent : '';
            
            return {
                id: id,
                name: companyName,
                email: `info@${companyName.toLowerCase().replace(/\s+/g, '')}.com`, // Simülasyon için oluşturulan e-posta
                company_name: companyName,
                address: companyAddress,
                phone: companyElement ? companyElement.querySelector('.company-contact span:first-child').textContent : '',
                website: companyElement ? (companyElement.querySelector('.company-contact a') ? companyElement.querySelector('.company-contact a').href : '') : ''
            };
        });
        
        // E-posta gönderme işlemi
        const response = await sendEmail(recipients, subject, content);
        
        // Modal'ı kapat
        const emailModal = bootstrap.Modal.getInstance(document.getElementById('emailModal'));
        emailModal.hide();
        
        if (response.success) {
            showNotification(`${response.sentCount} firmaya e-posta başarıyla gönderildi`, 'success');
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        showNotification('E-posta gönderilirken bir hata oluştu: ' + error.message, 'danger');
    } finally {
        // Gönderim butonunu eski haline getir
        const sendButton = document.getElementById('send-email-submit');
        sendButton.disabled = false;
        sendButton.textContent = 'Gönder';
    }
}

// Toplu İşlem Butonlarını Güncelle
function updateBulkActionButtons() {
    const sendEmailBtn = document.getElementById('send-email-btn');
    const sendWhatsAppBtn = document.getElementById('send-whatsapp-btn');
    const saveResultsBtn = document.getElementById('save-results-btn');
    
    // Seçili firma sayısını al
    const selectedCount = document.querySelectorAll('#search-results .company-checkbox:checked').length;
    
    // Butonları güncelle
    if (sendEmailBtn) {
        sendEmailBtn.disabled = selectedCount === 0;
        sendEmailBtn.title = selectedCount === 0 ? 'Lütfen en az bir firma seçin' : `${selectedCount} firmaya e-posta gönder`;
    }
    
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.disabled = selectedCount === 0;
        sendWhatsAppBtn.title = selectedCount === 0 ? 'Lütfen en az bir firma seçin' : `${selectedCount} firmaya WhatsApp mesajı gönder`;
    }
    
    if (saveResultsBtn) {
        saveResultsBtn.disabled = selectedCount === 0;
        saveResultsBtn.title = selectedCount === 0 ? 'Lütfen en az bir firma seçin' : `${selectedCount} firmayı kaydet`;
    }
} 