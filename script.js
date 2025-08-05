// Global variables
let signaturePad = null;
let currentStep = 1;
let signatureData = null;
let identityData = null;

// DOM Elements
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSignaturePad();
    initializeDemoSteps();
    initializeComplianceChecker();
    initializeAnimations();
    setCurrentDate();
});

// Navigation functionality
function initializeNavigation() {
    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth scroll on page load
    if (window.location.hash) {
        setTimeout(() => {
            const targetId = window.location.hash.substring(1);
            scrollToSection(targetId);
        }, 100);
    }
}

// Scroll to section with offset for fixed navbar
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navbarHeight = 70;
        const sectionTop = section.offsetTop - navbarHeight;
        
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
        
        // Update URL without triggering scroll
        if (history.pushState) {
            history.pushState(null, null, `#${sectionId}`);
        }
    }
}

// Initialize signature pad
function initializeSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    const signaturePadElement = document.getElementById('signaturePad');
    const placeholder = signaturePadElement.querySelector('.signature-placeholder');
    
    if (!canvas) return;
    
    // Set canvas size
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        
        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastPoint = null;
    
    // Drawing functions
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const point = getPoint(e, rect);
        lastPoint = point;
        
        signaturePadElement.classList.add('has-signature', 'active');
        placeholder.style.opacity = '0';
        
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const point = getPoint(e, rect);
        
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        lastPoint = point;
    }
    
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Save signature data
        signatureData = canvas.toDataURL();
        
        // Enable next step button
        const nextButton = document.getElementById('nextStep1');
        if (nextButton) {
            nextButton.disabled = false;
        }
    }
    
    function getPoint(e, rect) {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrawing(e);
    });
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        draw(e);
    });
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        stopDrawing();
    });
    
    // Clear signature function
    const clearButton = document.getElementById('clearSignature');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            signaturePadElement.classList.remove('has-signature', 'active');
            placeholder.style.opacity = '1';
            signatureData = null;
            
            const nextButton = document.getElementById('nextStep1');
            if (nextButton) {
                nextButton.disabled = true;
            }
        });
    }
}

// Initialize demo steps
function initializeDemoSteps() {
    const steps = document.querySelectorAll('.step');
    const stepContents = document.querySelectorAll('.demo-step-content');
    
    // Step navigation
    steps.forEach((step, index) => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.dataset.step);
            if (stepNumber <= currentStep || hasCompletedStep(stepNumber - 1)) {
                goToStep(stepNumber);
            }
        });
    });
    
    // Next step buttons
    const nextStep1 = document.getElementById('nextStep1');
    const nextStep2 = document.getElementById('nextStep2');
    const prevStep2 = document.getElementById('prevStep2');
    const prevStep3 = document.getElementById('prevStep3');
    
    if (nextStep1) {
        nextStep1.addEventListener('click', function() {
            if (signatureData) {
                goToStep(2);
            } else {
                showAlert('Veuillez créer votre signature avant de continuer.', 'warning');
            }
        });
    }
    
    if (nextStep2) {
        nextStep2.addEventListener('click', function(e) {
            e.preventDefault();
            const form = document.getElementById('identityForm');
            if (form.checkValidity()) {
                collectIdentityData();
                generateCertificate();
                goToStep(3);
            } else {
                form.reportValidity();
            }
        });
    }
    
    if (prevStep2) {
        prevStep2.addEventListener('click', function() {
            goToStep(1);
        });
    }
    
    if (prevStep3) {
        prevStep3.addEventListener('click', function() {
            goToStep(2);
        });
    }
    
    // Download certificate
    const downloadButton = document.getElementById('downloadCert');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadCertificate);
    }
}

// Navigate to specific step
function goToStep(stepNumber) {
    currentStep = stepNumber;
    
    // Update step indicators
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.classList.toggle('active', index + 1 === stepNumber);
    });
    
    // Show/hide step content
    const stepContents = document.querySelectorAll('.demo-step-content');
    stepContents.forEach((content, index) => {
        content.classList.toggle('hidden', index + 1 !== stepNumber);
    });
    
    // Add animation
    const activeContent = document.getElementById(`step${stepNumber}`);
    if (activeContent) {
        activeContent.style.opacity = '0';
        setTimeout(() => {
            activeContent.style.opacity = '1';
            activeContent.style.transform = 'translateY(0)';
        }, 50);
    }
}

// Check if step is completed
function hasCompletedStep(stepNumber) {
    switch (stepNumber) {
        case 1:
            return signatureData !== null;
        case 2:
            return identityData !== null;
        default:
            return false;
    }
}

// Collect identity data from form
function collectIdentityData() {
    const form = document.getElementById('identityForm');
    const formData = new FormData(form);
    
    identityData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        organization: formData.get('organization') || 'Non spécifiée',
        signatureDate: formData.get('signatureDate')
    };
}

// Generate certificate
function generateCertificate() {
    if (!identityData || !signatureData) return;
    
    // Generate hash
    const dataToHash = `${identityData.fullName}${identityData.email}${identityData.signatureDate}${signatureData}`;
    const hash = generateSHA256Hash(dataToHash);
    
    // Update certificate fields
    document.getElementById('certName').textContent = identityData.fullName;
    document.getElementById('certEmail').textContent = identityData.email;
    document.getElementById('certOrganization').textContent = identityData.organization;
    document.getElementById('certDate').textContent = formatDate(identityData.signatureDate);
    document.getElementById('certHash').textContent = hash;
    
    // Display signature
    const certSignature = document.getElementById('certSignature');
    if (certSignature && signatureData) {
        const img = document.createElement('img');
        img.src = signatureData;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        certSignature.innerHTML = '';
        certSignature.appendChild(img);
    }
}

// Generate SHA-256 hash (simplified version for demo)
function generateSHA256Hash(data) {
    // This is a simplified hash function for demonstration purposes
    // In a real application, you would use a proper cryptographic library
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to hex and pad to simulate SHA-256 format
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}${'a'.repeat(56)}`; // Simulated SHA-256 format
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Download certificate
function downloadCertificate() {
    const certificate = document.getElementById('certificate');
    if (!certificate) return;
    
    // Create a simple text version of the certificate
    const certificateText = `
CERTIFICAT DE SIGNATURE ÉLECTRONIQUE
====================================

Signataire: ${identityData.fullName}
Email: ${identityData.email}
Organisation: ${identityData.organization}
Date de signature: ${formatDate(identityData.signatureDate)}
Hash SHA-256: ${document.getElementById('certHash').textContent}

Ce certificat atteste que le document a été signé électroniquement
par la personne mentionnée ci-dessus à la date indiquée.

Généré par E-Signatures - Formation aux signatures électroniques
`;
    
    // Create and download file
    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificat-signature-${identityData.fullName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showAlert('Certificat téléchargé avec succès !', 'success');
}

// Initialize compliance checker
function initializeComplianceChecker() {
    const checkboxes = document.querySelectorAll('input[name="compliance"]');
    const result = document.getElementById('complianceResult');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateComplianceResult);
    });
    
    function updateComplianceResult() {
        const checkedCount = document.querySelectorAll('input[name="compliance"]:checked').length;
        const totalCount = checkboxes.length;
        const percentage = (checkedCount / totalCount) * 100;
        
        result.classList.remove('success', 'warning', 'error');
        result.classList.add('show');
        
        if (percentage === 100) {
            result.classList.add('success');
            result.querySelector('.result-text').textContent = 'Conformité complète - Signature juridiquement valable';
        } else if (percentage >= 75) {
            result.classList.add('warning');
            result.querySelector('.result-text').textContent = 'Conformité partielle - Vérifiez les points manquants';
        } else {
            result.classList.add('error');
            result.querySelector('.result-text').textContent = 'Non-conformité - Signature juridiquement invalide';
        }
    }
}

// Initialize animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll(
        '.learning-card, .legal-card, .tool-card, .practice-item'
    );
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Set current date in form
function setCurrentDate() {
    const dateInput = document.getElementById('signatureDate');
    if (dateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dateInput.value = now.toISOString().slice(0, 16);
    }
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-message">${message}</span>
            <button class="alert-close" aria-label="Fermer">&times;</button>
        </div>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 2000;
        max-width: 300px;
        transform: translateX(400px);
        transition: transform 0.3s ease-in-out;
    `;
    
    // Add to document
    document.body.appendChild(alert);
    
    // Animate in
    setTimeout(() => {
        alert.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        alert.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(alert)) {
            alert.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(alert)) {
                    document.body.removeChild(alert);
                }
            }, 300);
        }
    }, 5000);
}

// Handle scroll for navbar background
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(20px)';
    } else {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    }
});

// Update active navigation link based on scroll position
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navbarHeight = 70;
    
    let currentSection = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - navbarHeight - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key to close mobile menu
    if (e.key === 'Escape') {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
    
    // Enter key for buttons and links
    if (e.key === 'Enter' && e.target.matches('.btn, .nav-link')) {
        e.target.click();
    }
});

// Form validation enhancements
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('identityForm');
    if (form) {
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    this.style.borderColor = '#ef4444';
                } else {
                    this.style.borderColor = '#10b981';
                }
            });
            
            input.addEventListener('input', function() {
                if (this.style.borderColor === 'rgb(239, 68, 68)') {
                    this.style.borderColor = '#d1d5db';
                }
            });
        });
    }
});

// Performance optimization: Debounce resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize signature pad resize
const debouncedResize = debounce(() => {
    const canvas = document.getElementById('signatureCanvas');
    if (canvas && signaturePad) {
        // Re-initialize signature pad on resize
        initializeSignaturePad();
    }
}, 250);

window.addEventListener('resize', debouncedResize);

// Error handling for signature pad
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'CANVAS') {
        console.error('Canvas error:', e);
        showAlert('Erreur lors de l\'initialisation de la zone de signature', 'error');
    }
});

// Accessibility improvements
document.addEventListener('DOMContentLoaded', function() {
    // Add ARIA labels to interactive elements
    const signaturePad = document.getElementById('signaturePad');
    if (signaturePad) {
        signaturePad.setAttribute('role', 'application');
        signaturePad.setAttribute('aria-label', 'Zone de signature électronique');
    }
    
    // Add skip link for keyboard navigation
    const skipLink = document.createElement('a');
    skipLink.href = '#accueil';
    skipLink.textContent = 'Aller au contenu principal';
    skipLink.className = 'sr-only';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #2563eb;
        color: white;
        padding: 8px;
        text-decoration: none;
        z-index: 9999;
        border-radius: 4px;
    `;
    
    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateSHA256Hash,
        formatDate,
        scrollToSection,
        goToStep,
        hasCompletedStep
    };
}