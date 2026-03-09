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
        const touchThreshold = 60;
        let activeModalIndex = -1;
        let activeInstance = null;

        const getProjectTitle = function(link, fallbackIndex) {
            const titleElement = link ? link.querySelector(".folio-list__item-title") : null;
            const titleText = titleElement ? titleElement.textContent.trim() : "";
            return titleText || ("Project " + (fallbackIndex + 1));
        };

        const closePicker = function(instance) {
            const modalRoot = instance ? instance.element() : null;
            const nav = modalRoot ? modalRoot.querySelector(".project-modal-nav") : null;
            const trigger = nav ? nav.querySelector(".project-modal-nav__count") : null;
            const menu = nav ? nav.querySelector(".project-modal-nav__menu") : null;
            if (!nav || !menu) return;

            nav.classList.remove("project-modal-nav--open");
            menu.setAttribute("hidden", "");
            if (trigger) trigger.setAttribute("aria-expanded", "false");
        };

        const syncPickerState = function(instance, index) {
            const modalRoot = instance ? instance.element() : null;
            const menu = modalRoot ? modalRoot.querySelector(".project-modal-nav__menu") : null;
            if (!menu) return;

            menu.querySelectorAll(".project-modal-nav__menu-item").forEach(function(item) {
                const itemIndex = Number(item.getAttribute("data-modal-index"));
                const isCurrent = itemIndex === index;
                item.classList.toggle("is-active", isCurrent);
                if (isCurrent) {
                    item.setAttribute("aria-current", "true");
                    return;
                }
                item.removeAttribute("aria-current");
            });
        };

        const getNavigableTotal = function() {
            return modals.filter(Boolean).length;
        };

        const updateCounter = function(instance, index) {
            const modalRoot = instance ? instance.element() : null;
            const counterValue = modalRoot ? modalRoot.querySelector(".project-modal-nav__count-value") : null;
            const counterTrigger = modalRoot ? modalRoot.querySelector(".project-modal-nav__count") : null;
            if (!counterValue || !counterTrigger) return;

            const total = getNavigableTotal();
            counterValue.textContent = total ? (index + 1) + " / " + total : "";
            counterTrigger.setAttribute("aria-label", "Project " + (index + 1) + " of " + total + ". Click here to access the projects directly.");
        };

        const normalizeIndex = function(index) {
            const total = modals.length;
            if (!total) return -1;
            return (index + total) % total;
        };

        const showModal = function(index) {
            const nextIndex = normalizeIndex(index);
            if (nextIndex < 0 || !modals[nextIndex]) return;

            const nextInstance = modals[nextIndex];
            const previousInstance = activeInstance;

            activeModalIndex = nextIndex;

            if (previousInstance && previousInstance !== nextInstance && previousInstance.visible()) {
                previousInstance.close();
            }

            activeInstance = nextInstance;
            updateCounter(nextInstance, nextIndex);
            syncPickerState(nextInstance, nextIndex);
            closePicker(nextInstance);

            if (!nextInstance.visible()) {
                nextInstance.show();
            }
        };

        const navigateBy = function(step) {
            if (activeModalIndex < 0) return;
            showModal(activeModalIndex + step);
        };

        const keyHandler = function(event) {
            if (event.key === "Escape") {
                if (activeInstance && activeInstance.visible()) {
                    activeInstance.close();
                }
                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                navigateBy(1);
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                navigateBy(-1);
            }
        };

        const attachNavigationControls = function(instance) {
            const modalRoot = instance.element();
            if (!modalRoot || modalRoot.querySelector(".project-modal-nav")) return;

            const nav = document.createElement("div");
            nav.className = "project-modal-nav";

            const trigger = document.createElement("button");
            trigger.type = "button";
            trigger.className = "project-modal-nav__count";
            trigger.setAttribute("aria-haspopup", "true");
            trigger.setAttribute("aria-expanded", "false");

            const countValue = document.createElement("span");
            countValue.className = "project-modal-nav__count-value";
            countValue.setAttribute("aria-live", "polite");

            const countNote = document.createElement("span");
            countNote.className = "project-modal-nav__hint";
            countNote.textContent = "Click here to access the projects directly";

            trigger.appendChild(countValue);
            trigger.appendChild(countNote);

            const pickerMenu = document.createElement("div");
            pickerMenu.className = "project-modal-nav__menu";
            pickerMenu.setAttribute("hidden", "");

            modals.forEach(function(modalInstance, modalIndex) {
                if (!modalInstance) return;

                const menuItem = document.createElement("button");
                menuItem.type = "button";
                menuItem.className = "project-modal-nav__menu-item";
                menuItem.setAttribute("data-modal-index", String(modalIndex));
                menuItem.textContent = (modalIndex + 1) + ". " + getProjectTitle(folioLinks[modalIndex], modalIndex);

                menuItem.addEventListener("click", function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    closePicker(instance);
                    showModal(modalIndex);
                });

                pickerMenu.appendChild(menuItem);
            });

            const prevButton = document.createElement("button");
            prevButton.type = "button";
            prevButton.className = "project-modal-nav__btn project-modal-nav__btn--prev";
            prevButton.setAttribute("aria-label", "Previous project");
            prevButton.textContent = "<";

            const nextButton = document.createElement("button");
            nextButton.type = "button";
            nextButton.className = "project-modal-nav__btn project-modal-nav__btn--next";
            nextButton.setAttribute("aria-label", "Next project");
            nextButton.textContent = ">";

            prevButton.addEventListener("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
                navigateBy(-1);
            });

            nextButton.addEventListener("click", function(event) {
                event.preventDefault();
                event.stopPropagation();
                navigateBy(1);
            });

            trigger.addEventListener("click", function(event) {
                event.preventDefault();
                event.stopPropagation();

                const isOpen = nav.classList.contains("project-modal-nav--open");
                if (isOpen) {
                    closePicker(instance);
                    return;
                }

                nav.classList.add("project-modal-nav--open");
                pickerMenu.removeAttribute("hidden");
                trigger.setAttribute("aria-expanded", "true");
                syncPickerState(instance, activeModalIndex);
            });

            nav.addEventListener("click", function(event) {
                event.stopPropagation();
            });

            pickerMenu.addEventListener("click", function(event) {
                event.stopPropagation();
            });

            nav.appendChild(trigger);
            nav.appendChild(pickerMenu);
            nav.appendChild(prevButton);
            nav.appendChild(nextButton);
            modalRoot.appendChild(nav);
        };

        folioLinks.forEach(function(link) {
            const modalSelector = link.getAttribute("href");
            const modalElement = modalSelector ? document.querySelector(modalSelector) : null;

            if (!modalElement) {
                modals.push(null);
                return;
            }

            let instance = null;
            let touchStartX = 0;
            let touchStartY = 0;

            const touchStartHandler = function(event) {
                const touch = event.changedTouches && event.changedTouches[0];
                if (!touch) return;
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            };

            const touchEndHandler = function(event) {
                const touch = event.changedTouches && event.changedTouches[0];
                if (!touch) return;

                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                if (Math.abs(deltaX) < touchThreshold) return;
                if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

                if (deltaX > 0) {
                    navigateBy(-1);
                    return;
                }

                navigateBy(1);
            };

            instance = basicLightbox.create(modalElement, {
                onShow: function() {
                    activeInstance = instance;
                    attachNavigationControls(instance);
                    updateCounter(instance, activeModalIndex);
                    syncPickerState(instance, activeModalIndex);
                    document.addEventListener("keydown", keyHandler);

                    const modalRoot = instance.element();
                    if (!modalRoot) return;
                    modalRoot.addEventListener("touchstart", touchStartHandler, passiveEvent);
                    modalRoot.addEventListener("touchend", touchEndHandler, passiveEvent);
                },
                onClose: function() {
                    closePicker(instance);

                    const modalRoot = instance.element();
                    if (modalRoot) {
                        modalRoot.removeEventListener("touchstart", touchStartHandler, passiveEvent);
                        modalRoot.removeEventListener("touchend", touchEndHandler, passiveEvent);
                    }

                    document.removeEventListener("keydown", keyHandler);

                    if (activeInstance === instance) {
                        activeInstance = null;
                    }
                }
            });

            modals.push(instance);
        });

        folioLinks.forEach(function(link, index) {
            link.addEventListener("click", function(event) {
                event.preventDefault();
                showModal(index);
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
