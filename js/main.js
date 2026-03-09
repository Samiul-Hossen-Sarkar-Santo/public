/* ===================================================================
 * Luther 1.0.0 - Main JS
 *
 * ------------------------------------------------------------------- */

(function(html) {

    "use strict";

    html.className = html.className.replace(/\bno-js\b/g, "") + " js ";

    const MOBILE_BREAKPOINT = "(max-width: 800px)";
    const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
    const passiveEvent = { passive: true };

    const ssShouldReduceMotion = function() {
        return window.matchMedia(REDUCED_MOTION).matches;
    };


/* Animations
    * -------------------------------------------------- */
    const tl = typeof anime !== "undefined"
        ? anime.timeline({
            easing: "easeInOutCubic",
            duration: 800,
            autoplay: false
        })
        .add({
            targets: "#loader",
            opacity: 0,
            duration: 200,
            begin: function() {
                window.scrollTo(0, 0);
            }
        })
        .add({
            targets: "#preloader",
            opacity: 0,
            complete: function() {
                const preloader = document.querySelector("#preloader");
                if (!preloader) return;
                preloader.style.visibility = "hidden";
                preloader.style.display = "none";
            }
        })
        .add({
            targets: ".s-header",
            translateY: [-100, 0],
            opacity: [0, 1]
        }, "-=200")
        .add({
            targets: [".intro-content .text-pretitle", ".intro-content .text-huge-title", ".intro-mobile-top .text-pretitle", ".intro-mobile-title"],
            translateX: [100, 0],
            opacity: [0, 1],
            delay: anime.stagger(400)
        })
        .add({
            // Show mobile photo/about immediately after intro text (no extra stagger).
            targets: ".intro-mobile-about",
            translateX: [-50, 0],
            opacity: [0, 1],
            duration: 550
        })
        .add({
            targets: ".circles span",
            keyframes: [
                { opacity: [0, 0.3] },
                { opacity: [0.3, 0.1], delay: anime.stagger(100, { direction: "reverse" }) }
            ],
            delay: anime.stagger(100, { direction: "reverse" })
        })
        .add({
            targets: [".intro-social li", ".intro-mobile-actions"],
            translateX: [-50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, { direction: "reverse" })
        })
        .add({
            targets: [".intro-scrolldown", ".intro-mobile-scroll"],
            translateY: [100, 0],
            opacity: [0, 1]
        }, "-=800")
        : null;


/* Preloader
    * -------------------------------------------------- */
    const ssPreloader = function() {

        const preloader = document.querySelector("#preloader");
        if (!preloader) return;

        let hasRevealed = false;

        const revealPage = function() {
            if (hasRevealed) return;
            hasRevealed = true;

            html.classList.remove("ss-preload");
            html.classList.add("ss-loaded");

            document.querySelectorAll(".ss-animated").forEach(function(item) {
                item.classList.remove("ss-animated");
            });

            if (ssShouldReduceMotion() || !tl) {
                preloader.style.visibility = "hidden";
                preloader.style.display = "none";
                return;
            }

            // Keep mobile photo/about hidden until its timeline step.
            const introMobileAbout = document.querySelector(".intro-mobile-about");
            if (introMobileAbout) {
                introMobileAbout.style.opacity = 0;
                introMobileAbout.style.transform = "translateX(-50px)";
            }

            tl.play();
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", revealPage, { once: true });
        } else {
            window.requestAnimationFrame(revealPage);
        }

        window.addEventListener("load", revealPage, { once: true });

        // Keep the preloader from blocking interaction too long on slower networks.
        window.setTimeout(revealPage, 1200);

    }; // end ssPreloader


   /* Mobile Menu
    * ---------------------------------------------------- */
    const ssMobileMenu = function() {

        const toggleButton = document.querySelector(".mobile-menu-toggle");
        const mainNavWrap = document.querySelector(".main-nav-wrap");
        const siteBody = document.querySelector("body");

        if (!(toggleButton && mainNavWrap)) return;

        toggleButton.addEventListener("click", function(event) {
            event.preventDefault();
            toggleButton.classList.toggle("is-clicked");
            siteBody.classList.toggle("menu-is-open");
        });

        mainNavWrap.querySelectorAll(".main-nav a").forEach(function(link) {
            link.addEventListener("click", function() {

                // at 800px and below
                if (window.matchMedia(MOBILE_BREAKPOINT).matches) {
                    toggleButton.classList.toggle("is-clicked");
                    siteBody.classList.toggle("menu-is-open");
                }
            });
        });

        window.addEventListener("resize", function() {

            // above 800px
            if (window.matchMedia("(min-width: 801px)").matches) {
                if (siteBody.classList.contains("menu-is-open")) siteBody.classList.remove("menu-is-open");
                if (toggleButton.classList.contains("is-clicked")) toggleButton.classList.remove("is-clicked");
            }
        });

    }; // end ssMobileMenu


   /* Highlight active menu link on pagescroll
    * ------------------------------------------------------ */
    const ssScrollSpy = function() {

        const sections = Array.from(document.querySelectorAll(".target-section"));
        if (!sections.length) return;

        const sectionMap = new Map();
        sections.forEach(function(section) {
            const sectionId = section.getAttribute("id");
            if (!sectionId) return;

            const navLink = document.querySelector('.main-nav a[href*="' + sectionId + '"]');
            if (navLink && navLink.parentNode) {
                sectionMap.set(section, navLink.parentNode);
            }
        });

        const navItems = Array.from(sectionMap.values());
        if (!navItems.length) return;

        const setCurrent = function(currentItem) {
            navItems.forEach(function(item) {
                item.classList.toggle("current", item === currentItem);
            });
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    const activeItem = sectionMap.get(entry.target);
                    if (activeItem) setCurrent(activeItem);
                });
            }, {
                root: null,
                threshold: 0.45,
                rootMargin: "-35% 0px -45% 0px"
            });

            sections.forEach(function(section) {
                observer.observe(section);
            });

            return;
        }

        let ticking = false;

        const navHighlight = function() {
            if (ticking) return;
            ticking = true;

            window.requestAnimationFrame(function() {
                const scrollY = window.pageYOffset;
                let activeItem = null;

                sections.forEach(function(section) {
                    if (!sectionMap.has(section)) return;

                    const sectionHeight = section.offsetHeight;
                    const sectionTop = section.offsetTop - 60;

                    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                        activeItem = sectionMap.get(section);
                    }
                });

                if (activeItem) setCurrent(activeItem);
                ticking = false;
            });
        };

        window.addEventListener("scroll", navHighlight, passiveEvent);
        navHighlight();

    }; // end ssScrollSpy


   /* Animate elements if in viewport
    * ------------------------------------------------------ */
    const ssViewAnimate = function() {

        const blocks = Array.from(document.querySelectorAll("[data-animate-block]"));
        if (!blocks.length) return;
        const isMobileView = window.matchMedia(MOBILE_BREAKPOINT).matches;

        const revealBlock = function(block, shouldAnimate = true) {
            if (block.classList.contains("ss-animated")) return;
            block.classList.add("ss-animated");

            const targets = block.querySelectorAll("[data-animate-el]");
            if (!targets.length) return;

            if (!shouldAnimate || ssShouldReduceMotion() || typeof anime === "undefined") {
                targets.forEach(function(target) {
                    target.style.opacity = 1;
                    target.style.transform = "none";
                });
                return;
            }

            anime({
                targets: targets,
                opacity: [0, 1],
                translateY: [100, 0],
                delay: anime.stagger(250, { start: 100 }),
                duration: 650,
                easing: "easeOutCubic"
            });
        };

        if (isMobileView) {
            blocks.forEach(function(block) {
                if (!block.closest(".s-about")) return;
                revealBlock(block, false);
            });
        }

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(function(entries, obs) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    revealBlock(entry.target);
                    obs.unobserve(entry.target);
                });
            }, {
                threshold: 0.2,
                rootMargin: "0px 0px -12% 0px"
            });

            blocks.forEach(function(block) {
                observer.observe(block);
            });

            return;
        }

        let ticking = false;

        const viewportAnimation = function() {
            if (ticking) return;
            ticking = true;

            window.requestAnimationFrame(function() {
                const scrollY = window.pageYOffset;
                const viewportHeight = window.innerHeight;

                blocks.forEach(function(block) {
                    if (block.classList.contains("ss-animated")) return;

                    const triggerTop = (block.offsetTop + (viewportHeight * 0.2)) - viewportHeight;
                    const blockBottom = triggerTop + block.offsetHeight;

                    if (scrollY > triggerTop && scrollY <= blockBottom) {
                        revealBlock(block);
                    }
                });

                ticking = false;
            });
        };

        window.addEventListener("scroll", viewportAnimation, passiveEvent);
        viewportAnimation();

    }; // end ssViewAnimate


   /* Swiper
    * ------------------------------------------------------ */
    const ssSwiper = function() {

        const swiperContainer = document.querySelector(".swiper-container");
        if (!swiperContainer || typeof Swiper === "undefined") return;

        new Swiper(swiperContainer, {
            slidesPerView: 1,
            pagination: {
                el: ".swiper-pagination",
                clickable: true
            },
            breakpoints: {
                // when window width is > 400px
                401: {
                    slidesPerView: 1,
                    spaceBetween: 20
                },
                // when window width is > 800px
                801: {
                    slidesPerView: 2,
                    spaceBetween: 32
                },
                // when window width is > 1200px
                1201: {
                    slidesPerView: 2,
                    spaceBetween: 80
                }
            }
        });

    }; // end ssSwiper


   /* Lightbox
    * ------------------------------------------------------ */
    const ssLightbox = function() {

        if (typeof basicLightbox === "undefined") return;

        const folioLinks = document.querySelectorAll(".folio-list__item-link");
        if (!folioLinks.length) return;

        const modals = [];

        folioLinks.forEach(function(link) {
            const modalSelector = link.getAttribute("href");
            const modalElement = modalSelector ? document.querySelector(modalSelector) : null;

            if (!modalElement) {
                modals.push(null);
                return;
            }

            let instance = null;

            const escapeHandler = function(event) {
                if (event.key === "Escape" && instance) {
                    instance.close();
                }
            };

            instance = basicLightbox.create(modalElement, {
                onShow: function() {
                    document.addEventListener("keydown", escapeHandler);
                },
                onClose: function() {
                    document.removeEventListener("keydown", escapeHandler);
                }
            });

            modals.push(instance);
        });

        folioLinks.forEach(function(link, index) {
            link.addEventListener("click", function(event) {
                event.preventDefault();
                if (modals[index]) modals[index].show();
            });
        });

    }; // end ssLightbox


   /* Alert boxes
    * ------------------------------------------------------ */
    const ssAlertBoxes = function() {

        const boxes = document.querySelectorAll(".alert-box");

        boxes.forEach(function(box) {
            box.addEventListener("click", function(event) {
                if (event.target.matches(".alert-box__close")) {
                    event.stopPropagation();
                    event.target.parentElement.classList.add("hideit");

                    setTimeout(function() {
                        box.style.display = "none";
                    }, 500);
                }
            });
        });

    }; // end ssAlertBoxes


   /* Smoothscroll
    * ------------------------------------------------------ */
    const ssMoveTo = function() {

        if (typeof MoveTo === "undefined") return;

        const triggers = document.querySelectorAll(".smoothscroll");
        if (!triggers.length) return;

        const easeFunctions = {
            easeInQuad: function(t, b, c, d) {
                t /= d;
                return c * t * t + b;
            },
            easeOutQuad: function(t, b, c, d) {
                t /= d;
                return -c * t * (t - 2) + b;
            },
            easeInOutQuad: function(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            },
            easeInOutCubic: function(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t * t + b;
                t -= 2;
                return c / 2 * (t * t * t + 2) + b;
            }
        };

        const moveTo = new MoveTo({
            tolerance: 0,
            duration: ssShouldReduceMotion() ? 0 : 900,
            easing: "easeInOutCubic",
            container: window
        }, easeFunctions);

        triggers.forEach(function(trigger) {
            moveTo.registerTrigger(trigger);
        });

    }; // end ssMoveTo


   /* Initialize
    * ------------------------------------------------------ */
    (function ssInit() {

        ssPreloader();
        ssMobileMenu();
        ssScrollSpy();
        ssViewAnimate();
        ssSwiper();
        ssLightbox();
        ssAlertBoxes();
        ssMoveTo();

    })();

})(document.documentElement);
