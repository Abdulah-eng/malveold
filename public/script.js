// Header scroll behavior
let lastScroll = 0;
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.classList.add('scrolled');
        
        if (currentScroll < lastScroll) {
            header.classList.add('visible');
        } else {
            header.classList.remove('visible');
        }
    } else {
        header.classList.remove('scrolled');
        header.classList.remove('visible');
    }
    
    lastScroll = currentScroll;
});

// Interactive News section (clickable + auto-rotate)
const newsQuote = document.getElementById('newsQuote');
const newsButtons = Array.from(document.querySelectorAll('.news-logo'));
let activeNews = 0;

function setNews(index) {
    newsButtons.forEach(btn => btn.classList.remove('active'));
    const btn = newsButtons[index];
    btn.classList.add('active');
    newsQuote.textContent = btn.getAttribute('data-quote');
    activeNews = index;
}

newsButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
        setNews(idx);
        restartNewsTimer();
    });
});

function rotateNews() {
    const next = (activeNews + 1) % newsButtons.length;
    setNews(next);
}

let newsTimer = setInterval(rotateNews, 2000);
function restartNewsTimer() {
    clearInterval(newsTimer);
    newsTimer = setInterval(rotateNews, 2000);
}

setNews(0);

// Admin panel tabs with progress line
const adminTabs = document.querySelectorAll('.feature-tab');
const adminImage = document.getElementById('adminImage');
let currentAdminTab = 0;

const adminImages = {
    infrastructure: 'https://via.placeholder.com/600x400/f0f0f0/333?text=Infrastructure+Control',
    analytics: 'https://via.placeholder.com/600x400/f0f0f0/333?text=Analytics+Dashboard',
    realtime: 'https://via.placeholder.com/600x400/f0f0f0/333?text=Real-time+Management',
    multiuser: 'https://via.placeholder.com/600x400/f0f0f0/333?text=User+Management'
};

function activateAdminTab(index) {
    adminTabs.forEach(tab => {
        tab.classList.remove('active');
        const progressLine = tab.querySelector('.progress-line');
        progressLine.style.width = '0';
    });
    
    const currentTab = adminTabs[index];
    currentTab.classList.add('active');
    
    // Update image
    const tabType = currentTab.dataset.tab;
    adminImage.src = adminImages[tabType];
    
    // Start progress line animation
    setTimeout(() => {
        const progressLine = currentTab.querySelector('.progress-line');
        progressLine.style.width = '100%';
    }, 100);
}

function autoSwitchAdminTabs() {
    activateAdminTab(currentAdminTab);
    currentAdminTab = (currentAdminTab + 1) % adminTabs.length;
}

// Start the auto-switch
autoSwitchAdminTabs();

// Manual click on admin tabs
adminTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        clearInterval(adminInterval);
        currentAdminTab = index;
        activateAdminTab(index);
        // Restart auto-switch after manual selection
        adminInterval = setInterval(autoSwitchAdminTabs, 3000);
    });
});

let adminInterval = setInterval(autoSwitchAdminTabs, 3000);

// Mobile app feature options (white buttons) — click + auto-rotate
const featureItems = Array.from(document.querySelectorAll('.feature-item'));
const appVideo = document.getElementById('appVideo');

const videos = {
    location: 'https://via.placeholder.com/300x600/000/fff?text=Location+Video',
    multivendor: 'https://via.placeholder.com/300x600/000/fff?text=Multivendor+Video',
    ar: 'https://via.placeholder.com/300x600/000/fff?text=AR+Video',
    delivery: 'https://via.placeholder.com/300x600/000/fff?text=Delivery+Video',
    payment: 'https://via.placeholder.com/300x600/000/fff?text=Payment+Video',
    tracking: 'https://via.placeholder.com/300x600/000/fff?text=Tracking+Video'
};

let activeFeatureItem = 0;

function setFeatureItem(index) {
    featureItems.forEach(fi => fi.classList.remove('active'));
    const item = featureItems[index];
    if (!item) return;
    item.classList.add('active');
    const videoType = item.dataset.video;
    if (videos[videoType]) {
        appVideo.src = videos[videoType];
        appVideo.play();
    }
    activeFeatureItem = index;
}

featureItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        setFeatureItem(index);
        restartFeatureItemTimer();
    });
});

function rotateFeatureItems() {
    const next = (activeFeatureItem + 1) % featureItems.length;
    setFeatureItem(next);
}

let featureItemTimer = setInterval(rotateFeatureItems, 2000);
function restartFeatureItemTimer() {
    clearInterval(featureItemTimer);
    featureItemTimer = setInterval(rotateFeatureItems, 2000);
}

setFeatureItem(0);

// Delivery partners animation
const partnerIcons = document.querySelectorAll('.partner-icon');
let currentPartner = 6; // Start with DoorDash (index 6)

function animatePartners() {
    partnerIcons.forEach(icon => icon.classList.remove('active'));
    partnerIcons[currentPartner].classList.add('active');
    currentPartner = (currentPartner + 1) % partnerIcons.length;
}

setInterval(animatePartners, 2000);

// Feature cards auto-progress (blue line + highlight next)
const featureCards = Array.from(document.querySelectorAll('#featureCards .feature-card'));
let activeFeature = 0;

function setFeature(index) {
    // Instantly clear progress on all previous cards so the blue line "goes away"
    featureCards.forEach(card => {
        const progress = card.querySelector('.feature-progress');
        if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '0';
            // force reflow to apply the immediate reset
            void progress.offsetWidth;
            progress.style.transition = 'width 3s linear';
        }
        card.classList.remove('active');
    });

    const target = featureCards[index];
    target.classList.add('active');
    const targetProgress = target.querySelector('.feature-progress');
    if (targetProgress) {
        targetProgress.style.transition = 'width 3s linear';
        // start from 0 and animate to 100
        targetProgress.style.width = '0';
        requestAnimationFrame(() => {
            targetProgress.style.width = '100%';
        });
    }
    activeFeature = index;
}

function rotateFeature() {
    const next = (activeFeature + 1) % featureCards.length;
    setFeature(next);
}

let featureTimer = setInterval(rotateFeature, 3000);
featureCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
        setFeature(idx);
        clearInterval(featureTimer);
        featureTimer = setInterval(rotateFeature, 3000);
    });
});

// init first
setFeature(0);

// Testimonial carousel
const testimonials = [
    {
        image: 'https://via.placeholder.com/400x300/E74C3C/fff?text=Chef',
        quote: [
            "Partnering with Hyperzod has transformed our Italian family's hospitality business in Australia's fast-moving, tech-savvy market.",
            "Their advanced app and website system streamlines our pizza operations, and their exceptional customer service handles every request within hours. We're grateful to work with such a reliable, forward-thinking team."
        ],
        name: "Oliver Portocarrero",
        role: "Founder at The Cheesy One Pizza",
        logo: 'https://via.placeholder.com/80x80/fff/333?text=Pizza'
    },
    {
        image: 'https://via.placeholder.com/400x300/3498DB/fff?text=Owner',
        quote: [
            "Hyperzod's platform revolutionized our delivery operations. The seamless integration and real-time tracking features have significantly improved our customer satisfaction.",
            "The support team is incredibly responsive and helped us customize the solution to perfectly fit our needs."
        ],
        name: "Sarah Chen",
        role: "CEO at Fresh Eats Market",
        logo: 'https://via.placeholder.com/80x80/fff/333?text=Fresh'
    },
    {
        image: 'https://via.placeholder.com/400x300/2ECC71/fff?text=Manager',
        quote: [
            "We've seen a 40% increase in delivery orders since implementing Hyperzod. The user-friendly interface makes it easy for our customers to order.",
            "The analytics dashboard provides invaluable insights that help us optimize our operations daily."
        ],
        name: "Michael Roberts",
        role: "Operations Manager at Quick Bites",
        logo: 'https://via.placeholder.com/80x80/fff/333?text=QB'
    }
];

let currentTestimonial = 0;
const prevBtn = document.querySelector('.nav-btn.prev');
const nextBtn = document.querySelector('.nav-btn.next');
const dots = document.querySelectorAll('.dot');

function updateTestimonial(index) {
    const card = document.querySelector('.testimonial-card');
    const testimonial = testimonials[index];
    
    // Update content
    card.querySelector('img').src = testimonial.image;
    const quotes = card.querySelectorAll('blockquote p');
    quotes[0].textContent = testimonial.quote[0];
    quotes[1].textContent = testimonial.quote[1];
    card.querySelector('.author h4').textContent = testimonial.name;
    card.querySelector('.author p').textContent = testimonial.role;
    card.querySelector('.logo').src = testimonial.logo;
    
    // Update dots
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');
}

prevBtn.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    updateTestimonial(currentTestimonial);
});

nextBtn.addEventListener('click', () => {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    updateTestimonial(currentTestimonial);
});

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentTestimonial = index;
        updateTestimonial(currentTestimonial);
    });
});

// Reviews auto-scroll
const reviewsTrack = document.querySelector('.reviews-track');

// Pause animation on hover
reviewsTrack.addEventListener('mouseenter', () => {
    reviewsTrack.style.animationPlayState = 'paused';
});

reviewsTrack.addEventListener('mouseleave', () => {
    reviewsTrack.style.animationPlayState = 'running';
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Add fade-in animation to sections
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Initialize first testimonial
updateTestimonial(0);

// Mobile menu toggle
const toggleBtn = document.querySelector('.mobile-menu-toggle');
const navMenu = document.getElementById('navMenu');
if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });
}

