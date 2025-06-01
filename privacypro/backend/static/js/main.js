document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');
    
    mobileMenuBtn.addEventListener('click', function() {
        // Create mobile menu
        if (!document.querySelector('.mobile-menu')) {
            const mobileMenu = document.createElement('div');
            mobileMenu.className = 'mobile-menu';
            
            // Clone navigation links
            const navClone = navLinks.cloneNode(true);
            
            // Clone auth buttons
            const authClone = authButtons.cloneNode(true);
            
            mobileMenu.appendChild(navClone);
            mobileMenu.appendChild(authClone);
            
            // Add to DOM
            document.body.appendChild(mobileMenu);
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            closeBtn.className = 'mobile-menu-close';
            mobileMenu.prepend(closeBtn);
            
            // Close menu functionality
            closeBtn.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                setTimeout(() => {
                    mobileMenu.remove();
                }, 300);
            });
            
            // Delay to trigger animation
            setTimeout(() => {
                mobileMenu.classList.add('active');
            }, 10);
        } else {
            const mobileMenu = document.querySelector('.mobile-menu');
            mobileMenu.classList.add('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for header
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.mobile-menu');
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    setTimeout(() => {
                        mobileMenu.remove();
                    }, 300);
                }
            }
        });
    });
    
    // Add additional styles for mobile menu
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: white;
            z-index: 1000;
            padding: 2rem;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        
        .mobile-menu.active {
            transform: translateX(0);
        }
        
        .mobile-menu .nav-links {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .mobile-menu .auth-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .mobile-menu-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
});