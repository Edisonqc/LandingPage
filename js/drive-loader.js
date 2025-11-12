class DriveLoader {
    constructor() {
        if (typeof DRIVE_CONFIG === 'undefined') {
            console.error('❌ DRIVE_CONFIG no está definido');
            return;
        }
        
        this.config = DRIVE_CONFIG;
        this.currentCarruselIndex = 0;
        this.carruselInterval = null;
        this.isAutoPlaying = true;
        console.log('🔧 Configuración cargada con carpeta carrusel');
        this.init();
    }

    async init() {
        console.log('🚀 Iniciando carga desde Drive...');
        
        try {
            await Promise.all([
                this.loadHeroImage(),
                this.loadVideosVertical(),
                this.loadCarrusel(),
                this.loadFinalImages()
            ]);
            console.log('✅ Todo cargado exitosamente');
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }

    async loadHeroImage() {
        try {
            console.log('🖼️ Cargando imagen hero...');
            
            const url = `https://www.googleapis.com/drive/v3/files?q='${this.config.CARPETA_IMAGENES}'+in+parents+and+mimeType+contains+'image'&key=${this.config.API_KEY}&fields=files(id,name)`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('📸 Imágenes hero encontradas:', data.files);

            if (data.files && data.files.length > 0) {
                const imagen = data.files[0];
                const heroImage = document.getElementById('hero-image');
                
                if (heroImage) {
                    const imageUrl = `https://drive.google.com/thumbnail?id=${imagen.id}&sz=w1000`;
                    
                    heroImage.innerHTML = `
                        <img src="${imageUrl}" 
                             alt="EducaWayra" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 1rem;"
                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'">
                    `;
                    console.log('✅ Imagen hero cargada:', imagen.name);
                }
            } else {
                this.loadHeroFallback();
            }
        } catch (error) {
            console.error('❌ Error cargando imagen hero:', error);
            this.loadHeroFallback();
        }
    }

    async loadVideosVertical() {
        try {
            console.log('🎬 Cargando videos...');
            
            const url = `https://www.googleapis.com/drive/v3/files?q='${this.config.CARPETA_VIDEOS}'+in+parents&key=${this.config.API_KEY}&fields=files(id,name,mimeType)`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('📁 Archivos en videos:', data.files);
            
            const videos = data.files ? data.files.filter(file => 
                file.mimeType.includes('video') || 
                /\.(mp4|avi|mov|wmv|flv|mkv|webm)$/i.test(file.name)
            ) : [];

            console.log('🎥 Videos filtrados:', videos);
            this.renderVideosVertical(videos);

        } catch (error) {
            console.error('❌ Error cargando videos:', error);
            this.renderVideosFallback();
        }
    }

    async loadCarrusel() {
        try {
            console.log('🎠 Cargando carrusel desde carpeta especial...');
            
            const url = `https://www.googleapis.com/drive/v3/files?q='${this.config.CARPETA_CARRUSEL}'+in+parents+and+mimeType+contains+'image'&key=${this.config.API_KEY}&fields=files(id,name)`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('🖼️ Imágenes para carrusel:', data.files);

            if (data.files && data.files.length > 0) {
                this.renderCarrusel(data.files);
                this.startAutoPlay();
            } else {
                console.log('❌ No hay imágenes en la carpeta carrusel');
                this.loadCarruselFallback();
            }
        } catch (error) {
            console.error('❌ Error cargando carrusel:', error);
            this.loadCarruselFallback();
        }
    }

    async loadFinalImages() {
        try {
            console.log('🏁 Cargando imágenes finales...');
            
            const url = `https://www.googleapis.com/drive/v3/files?q='${this.config.CARPETA_FINAL}'+in+parents+and+mimeType+contains+'image'&key=${this.config.API_KEY}&fields=files(id,name)`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('🖼️ Imágenes finales encontradas:', data.files);

            if (data.files && data.files.length >= 2) {
                // Tomar solo las primeras 2 imágenes
                const imagenesFinales = data.files.slice(0, 2);
                this.renderFinalImages(imagenesFinales);
            } else {
                this.loadFinalImagesFallback();
            }
        } catch (error) {
            console.error('❌ Error cargando imágenes finales:', error);
            this.loadFinalImagesFallback();
        }
    }

    renderVideosVertical(videos) {
        const videoContainer = document.getElementById('quechua-video');
        if (!videoContainer) return;

        if (!videos || videos.length === 0) {
            videoContainer.innerHTML = `
                <div class="no-video">
                    <i class="fas fa-video-slash"></i>
                    <p>Próximamente videos de estudiantes</p>
                </div>
            `;
            return;
        }

        videoContainer.innerHTML = videos.map((video, index) => `
            <div class="video-vertical-item">
                <div class="video-vertical-thumbnail" data-video-id="${video.id}">
                    <img src="https://drive.google.com/thumbnail?id=${video.id}&sz=w400" 
                         alt="${video.name}"
                         onerror="this.src='https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'">
                    <div class="video-vertical-play">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="video-vertical-info">
                    <p class="video-vertical-name">${this.cleanVideoName(video.name)}</p>
                    <button class="btn-watch-vertical" data-video-id="${video.id}">
                        <i class="fas fa-play"></i> Ver Video
                    </button>
                </div>
            </div>
        `).join('');

        this.addVideoEventListeners();
    }

    renderCarrusel(imagenes) {
        const carruselTrack = document.getElementById('carrusel-track');
        const carruselDots = document.getElementById('carrusel-dots');
        
        if (!carruselTrack || !carruselDots) return;

        console.log('🎠 Renderizando carrusel con', imagenes.length, 'imágenes');

        // Renderizar slides
        carruselTrack.innerHTML = imagenes.map((imagen, index) => `
            <div class="carrusel-slide" data-index="${index}">
                <img src="https://drive.google.com/thumbnail?id=${imagen.id}&sz=w800" 
                     alt="${imagen.name}"
                     loading="lazy"
                     onerror="this.style.display='none'">
            </div>
        `).join('');

        // Renderizar dots (solo si hay más de 1 imagen)
        if (imagenes.length > 1) {
            carruselDots.innerHTML = imagenes.map((_, index) => `
                <button class="carrusel-dot ${index === 0 ? 'active' : ''}" 
                        data-index="${index}"></button>
            `).join('');

            // Mostrar botones de navegación
            document.querySelectorAll('.carrusel-btn').forEach(btn => {
                btn.style.display = 'flex';
            });
        } else {
            carruselDots.innerHTML = '';
            // Ocultar botones si solo hay 1 imagen
            document.querySelectorAll('.carrusel-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }

        // Agregar event listeners
        this.addCarruselEventListeners(imagenes.length);
    }

    renderFinalImages(imagenes) {
        const container = document.getElementById('final-images');
        if (!container) return;

        console.log('🏁 Renderizando', imagenes.length, 'imágenes finales');

        // Agregar clase para diseño de 2 imágenes
        container.classList.add('two-images');

        container.innerHTML = imagenes.map((imagen, index) => `
            <div class="final-image-card">
                <div class="final-image">
                    <img src="https://drive.google.com/thumbnail?id=${imagen.id}&sz=w600" 
                         alt="${imagen.name}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                </div>
                <div class="final-image-content">
                    <h3>${index === 0 ? 'Excelencia Educativa' : 'Comunidad Global'}</h3>
                    <p>${index === 0 ? 
                        'Formación de calidad con metodologías innovadoras' : 
                        'Conectando culturas a través del aprendizaje de idiomas'
                    }</p>
                </div>
            </div>
        `).join('');
    }

    addCarruselEventListeners(totalSlides) {
        // Solo agregar controles si hay más de 1 slide
        if (totalSlides <= 1) return;

        // Botones anterior/siguiente
        document.querySelector('.carrusel-prev')?.addEventListener('click', () => {
            this.stopAutoPlay();
            this.prevSlide(totalSlides);
            this.restartAutoPlay();
        });
        
        document.querySelector('.carrusel-next')?.addEventListener('click', () => {
            this.stopAutoPlay();
            this.nextSlide(totalSlides);
            this.restartAutoPlay();
        });

        // Dots
        document.querySelectorAll('.carrusel-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                this.stopAutoPlay();
                const index = parseInt(e.target.getAttribute('data-index'));
                this.goToSlide(index, totalSlides);
                this.restartAutoPlay();
            });
        });

        // Pausar auto-play al hacer hover
        const carruselContainer = document.querySelector('.carrusel-container');
        if (carruselContainer) {
            carruselContainer.addEventListener('mouseenter', () => {
                this.stopAutoPlay();
            });
            
            carruselContainer.addEventListener('mouseleave', () => {
                if (this.isAutoPlaying) {
                    this.startAutoPlay();
                }
            });
        }
    }

    addVideoEventListeners() {
        document.querySelectorAll('.btn-watch-vertical, .video-vertical-thumbnail').forEach(element => {
            element.addEventListener('click', (e) => {
                const videoId = e.currentTarget.getAttribute('data-video-id');
                this.openVideoModal(videoId);
            });
        });
    }

    nextSlide(totalSlides) {
        this.currentCarruselIndex = (this.currentCarruselIndex + 1) % totalSlides;
        this.updateCarrusel(totalSlides);
    }

    prevSlide(totalSlides) {
        this.currentCarruselIndex = (this.currentCarruselIndex - 1 + totalSlides) % totalSlides;
        this.updateCarrusel(totalSlides);
    }

    goToSlide(index, totalSlides) {
        this.currentCarruselIndex = index;
        this.updateCarrusel(totalSlides);
    }

    updateCarrusel(totalSlides) {
        const track = document.querySelector('.carrusel-track');
        const dots = document.querySelectorAll('.carrusel-dot');
        
        if (track) {
            track.style.transform = `translateX(-${this.currentCarruselIndex * 100}%)`;
        }
        
        // Actualizar dots activos
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentCarruselIndex);
        });
    }

    startAutoPlay() {
        this.stopAutoPlay();
        
        const totalSlides = document.querySelectorAll('.carrusel-slide').length;
        if (totalSlides <= 1) return;
        
        this.isAutoPlaying = true;
        this.carruselInterval = setInterval(() => {
            this.nextSlide(totalSlides);
        }, 3000); // Cambia cada 3 segundos
    }

    stopAutoPlay() {
        if (this.carruselInterval) {
            clearInterval(this.carruselInterval);
            this.carruselInterval = null;
        }
        this.isAutoPlaying = false;
    }

    restartAutoPlay() {
        setTimeout(() => {
            if (!this.isAutoPlaying) {
                this.startAutoPlay();
            }
        }, 5000); // Reanudar después de 5 segundos
    }

    openVideoModal(videoId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="position: relative; width: 90%; max-width: 800px;">
                <button style="position: absolute; top: -50px; right: 0; background: #ff4757; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 16px; z-index: 10001;">
                    <i class="fas fa-times"></i> Cerrar
                </button>
                <div style="width: 100%; height: 0; padding-bottom: 56.25%; position: relative;">
                    <iframe src="https://drive.google.com/file/d/${videoId}/preview" 
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 10px;"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowfullscreen>
                    </iframe>
                </div>
            </div>
        `;
        
        modal.querySelector('button').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }

    cleanVideoName(name) {
        return name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    }

    loadHeroFallback() {
        const heroImage = document.getElementById('hero-image');
        if (heroImage) {
            heroImage.innerHTML = `
                <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-size: 3rem; border-radius: 1rem;">
                    <i class="fas fa-graduation-cap"></i>
                </div>
            `;
        }
    }

    loadCarruselFallback() {
        const carruselTrack = document.getElementById('carrusel-track');
        if (carruselTrack) {
            carruselTrack.innerHTML = `
                <div class="no-carrusel">
                    <i class="fas fa-images"></i>
                    <p>Sube imágenes a la carpeta CARRUSEL en Drive</p>
                    <p><small>Las imágenes aparecerán aquí automáticamente</small></p>
                </div>
            `;
        }
    }

    loadFinalImagesFallback() {
        const container = document.getElementById('final-images');
        if (container) {
            container.innerHTML = `
                <div class="no-images" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-images" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Sube 2 imágenes a la carpeta FINAL para verlas aquí</p>
                </div>
            `;
        }
    }

    renderVideosFallback() {
        const videoContainer = document.getElementById('quechua-video');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="no-video">
                    <i class="fas fa-wifi-slash"></i>
                    <p>No se pudieron cargar los videos</p>
                </div>
            `;
        }
    }
}

// Auto-refresh
function setupAutoRefresh() {
    setInterval(() => {
        console.log('🔄 Actualizando contenido...');
        new DriveLoader();
    }, 3 * 60 * 1000);
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    new DriveLoader();
    setupAutoRefresh();
});