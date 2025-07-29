// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, query, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Three.js and Spline Imports
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import SplineLoader from 'https://unpkg.com/@splinetool/loader@latest/dist/SplineLoader.js';

// Global variables for Firebase config and app ID (provided by Canvas environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let db;
let auth;
let userId = null;
let isAuthReady = false;

// Message Box Element
const messageBox = document.getElementById('message-box');

/**
 * Displays a temporary message box to the user.
 * @param {string} message - The message to display.
 * @param {string} type - 'success' or 'error' to determine styling.
 */
const showMessage = (message, type) => {
    messageBox.textContent = message;
    messageBox.className = `fixed top-20 left-1/2 -translate-x-1/2 p-4 rounded-lg text-white font-bold z-5000 transition-all duration-300 ease-in-out shadow-lg ${type} show`;
    messageBox.classList.remove('hidden');

    setTimeout(() => {
        messageBox.classList.remove('show');
        messageBox.classList.add('hidden');
    }, 3000); // Message disappears after 3 seconds
};

// Initialize Firebase and set up authentication
const initializeFirebase = async () => {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                console.log("Firebase Auth State Changed: User is signed in with UID:", userId);
                document.getElementById('user-id-display').textContent = userId;
            } else {
                if (initialAuthToken) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                        userId = auth.currentUser.uid;
                        console.log("Signed in with custom token. UID:", userId);
                        document.getElementById('user-id-display').textContent = userId;
                    } catch (error) {
                        console.error("Error signing in with custom token:", error);
                        showMessage("Error signing in. Trying anonymous access.", "error");
                        await signInAnonymously(auth);
                        userId = auth.currentUser.uid;
                        console.log("Signed in anonymously after custom token failure. UID:", userId);
                        document.getElementById('user-id-display').textContent = userId;
                    }
                } else {
                    await signInAnonymously(auth);
                    userId = auth.currentUser.uid;
                    console.log("Signed in anonymously. UID:", userId);
                    document.getElementById('user-id-display').textContent = userId;
                }
            }
            isAuthReady = true;
            // Once auth is ready, set up Firestore listeners and initial UI states
            setupFirestoreListeners();
            checkAllInitialLikeStates();
            loadSavedCars(); // Load saved cars for the authenticated user
            loadComments('ferrari-fxx'); // Load comments for Ferrari FXX (example)
        });
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        showMessage("Failed to initialize Firebase. Some features may not work.", "error");
    }
};

// Function to set up Firestore listeners for public data (likes)
const setupFirestoreListeners = () => {
    if (!isAuthReady || !db) {
        console.log("Firestore not ready, skipping public listener setup.");
        return;
    }

    const carIds = [
        'ferrari-fxx', 'pagani-zonda-r', 'lamborghini-sesto-elemento',
        'aston-martin-vulcan', 'bugatti-bolide', 'mclaren-gtr',
        'mercedes-clk-gtr', 'tvr-cerbera-speed-12', 'jaguar-xj220s',
        'lamborghini-strosek-diablo'
    ];

    carIds.forEach(carId => {
        const carLikesRef = doc(db, `artifacts/${appId}/public/data/carLikes`, carId);
        onSnapshot(carLikesRef, (docSnap) => {
            const likesElement = document.getElementById(`${carId}-likes`);
            if (likesElement) {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const likes = data.likes || 0;
                    likesElement.textContent = likes;
                } else {
                    likesElement.textContent = 0;
                    setDoc(carLikesRef, { likes: 0, likedBy: [] }, { merge: true }).catch(e => console.error(`Error setting initial likes for ${carId}:`, e));
                }
            }
        }, (error) => {
            console.error(`Error listening to ${carId} likes:`, error);
        });
    });
};

// Call initializeFirebase when the window loads
window.addEventListener('load', initializeFirebase);

// --- General JavaScript for UI Interactions ---

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuButton = document.getElementById('mobile-menu-button'); // Ensure this is accessible
            if (mobileMenu.classList.contains('translate-y-0')) {
                mobileMenu.classList.remove('translate-y-0', 'opacity-100');
                mobileMenu.classList.add('-translate-y-full', 'opacity-0');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
            }
        }
    });
});

// Back to Top button functionality
const backToTopButton = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) { // Show button after scrolling 300px
        backToTopButton.classList.add('scale-100', 'opacity-100');
        backToTopButton.classList.remove('scale-0', 'opacity-0');
    } else {
        backToTopButton.classList.remove('scale-100', 'opacity-100');
        backToTopButton.classList.add('scale-0', 'opacity-0');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Mobile Menu Toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuButton && mobileMenu) { // Ensure elements exist before adding listeners
    mobileMenuButton.addEventListener('click', () => {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.setAttribute('aria-hidden', isExpanded);

        mobileMenu.classList.toggle('-translate-y-full');
        mobileMenu.classList.toggle('translate-y-0');
        mobileMenu.classList.toggle('opacity-0');
        mobileMenu.classList.toggle('opacity-100');
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuButton.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('translate-y-0', 'opacity-100');
            mobileMenu.classList.add('-translate-y-full', 'opacity-0');
            mobileMenu.setAttribute('aria-hidden', 'true');
        });
    });
}


// Cursor Headlight Effect
const cursorHeadlight = document.getElementById('cursor-headlight');
if (cursorHeadlight) { // Ensure element exists
    document.addEventListener('mousemove', (e) => {
        cursorHeadlight.style.left = `${e.clientX}px`;
        cursorHeadlight.style.top = `${e.clientY}px`;
        cursorHeadlight.style.opacity = 1; /* Make visible on mouse move */
    });

    document.addEventListener('mouseleave', () => {
        cursorHeadlight.style.opacity = 0; /* Hide on mouse leave */
    });
}


// Dark/Light Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
const themeToggleMobile = document.getElementById('theme-toggle-mobile');
const htmlElement = document.documentElement;

// Function to set theme
const setTheme = (isDark) => {
    if (isDark) {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
    } else {
        htmlElement.classList.add('light');
        htmlElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    // Sync toggle states
    if (themeToggle) themeToggle.checked = isDark;
    if (themeToggleMobile) themeToggleMobile.checked = isDark;
};

// Initialize theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    setTheme(false);
} else {
    setTheme(true); // Default to dark
}

// Add event listeners for theme toggles
if (themeToggle) themeToggle.addEventListener('change', (e) => setTheme(e.target.checked));
if (themeToggleMobile) themeToggleMobile.addEventListener('change', (e) => setTheme(e.target.checked));


// Generic Like button functionality for all cars
document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', async (event) => {
        if (!isAuthReady || !db || !userId) {
            showMessage("Please wait, initializing user session...", "error");
            return;
        }

        const carId = button.id.replace('like-', '');
        const carLikesRef = doc(db, `artifacts/${appId}/public/data/carLikes`, carId);

        try {
            const docSnap = await getDoc(carLikesRef);
            let currentLikes = 0;
            let likedBy = [];

            if (docSnap.exists()) {
                const data = docSnap.data();
                currentLikes = data.likes || 0;
                likedBy = data.likedBy || [];
            }

            const userHasLiked = likedBy.includes(userId);

            if (!userHasLiked) {
                currentLikes++;
                likedBy.push(userId);
                await setDoc(carLikesRef, { likes: currentLikes, likedBy: likedBy }, { merge: true });
                button.classList.add('liked');
                showMessage(`You liked ${carId.replace(/-/g, ' ')}!`, "success");
            } else {
                currentLikes = Math.max(0, currentLikes - 1);
                likedBy = likedBy.filter(id => id !== userId);
                await setDoc(carLikesRef, { likes: currentLikes, likedBy: likedBy }, { merge: true });
                button.classList.remove('liked');
                showMessage(`You unliked ${carId.replace(/-/g, ' ')}.`, "success");
            }
        } catch (error) {
            console.error(`Error updating like count for ${carId}:`, error);
            showMessage(`Failed to update like for ${carId.replace(/-/g, ' ')}.`, "error");
        }
    });
});

// Generic Save to Garage button functionality
document.querySelectorAll('.save-button').forEach(button => {
    button.addEventListener('click', async () => {
        if (!isAuthReady || !db || !userId) {
            showMessage("Please wait, initializing user session...", "error");
            return;
        }

        const carId = button.id.replace('save-', '');
        const userGarageRef = doc(db, `artifacts/${appId}/users/${userId}/myGarage`, 'savedCars');

        try {
            const docSnap = await getDoc(userGarageRef);
            let savedCarIds = [];

            if (docSnap.exists()) {
                savedCarIds = docSnap.data().cars || [];
            }

            const isSaved = savedCarIds.includes(carId);

            if (!isSaved) {
                savedCarIds.push(carId);
                await setDoc(userGarageRef, { cars: savedCarIds }, { merge: true });
                button.classList.add('liked'); // Re-using 'liked' class for visual feedback
                showMessage(`Saved ${carId.replace(/-/g, ' ')} to your garage!`, "success");
            } else {
                savedCarIds = savedCarIds.filter(id => id !== carId);
                await setDoc(userGarageRef, { cars: savedCarIds }, { merge: true });
                button.classList.remove('liked');
                showMessage(`Removed ${carId.replace(/-/g, ' ')} from your garage.`, "success");
            }
            loadSavedCars(); // Refresh the saved cars list
        } catch (error) {
            console.error(`Error saving/removing ${carId} from garage:`, error);
            showMessage(`Failed to save/remove ${carId.replace(/-/g, ' ')} from garage.`, "error");
        }
    });
});

// Initial check for liked state on page load for all cars
const checkAllInitialLikeStates = async () => {
    if (!isAuthReady || !db || !userId) {
        setTimeout(checkAllInitialLikeStates, 100); // Retry after 100ms
        return;
    }

    const carIds = [
        'ferrari-fxx', 'pagani-zonda-r', 'lamborghini-sesto-elemento',
        'aston-martin-vulcan', 'bugatti-bolide', 'mclaren-gtr',
        'mercedes-clk-gtr', 'tvr-cerbera-speed-12', 'jaguar-xj220s',
        'lamborghini-strosek-diablo'
    ];

    for (const carId of carIds) {
        const carLikesRef = doc(db, `artifacts/${appId}/public/data/carLikes`, carId);
        const likeButton = document.getElementById(`like-${carId}`);
        if (likeButton) {
            try {
                const docSnap = await getDoc(carLikesRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const likedBy = data.likedBy || [];
                    if (likedBy.includes(userId)) {
                        likeButton.classList.add('liked');
                    } else {
                        likeButton.classList.remove('liked');
                    }
                }
            } catch (error) {
                console.error(`Error checking initial like state for ${carId}:`, error);
            }
        }
    }
};

// --- Carousel Functionality ---
/**
 * Initializes a simple image carousel within a given container.
 * @param {HTMLElement} container - The main carousel container element.
 */
const initCarousel = (container) => {
    const imagesContainer = container.querySelector('.carousel-images');
    const images = Array.from(imagesContainer.children);
    const prevButton = container.querySelector('.carousel-button.prev');
    const nextButton = container.querySelector('.carousel-button.next');
    let currentIndex = 0;

    const updateCarousel = () => {
        imagesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    };

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : images.length - 1;
        updateCarousel();
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex < images.length - 1) ? currentIndex + 1 : 0;
        updateCarousel();
    });

    // Initial setup
    imagesContainer.style.width = `${images.length * 100}%`;
    images.forEach(img => img.style.width = `${100 / images.length}%`);
    updateCarousel();
};

// Initialize all carousels on the page
document.querySelectorAll('.carousel-container').forEach(initCarousel);


// --- Three.js 3D Model Viewer ---
const initFerrariFXX3DViewer = () => {
    const canvas = document.getElementById('ferrari-fxx-3d-canvas');
    if (!canvas) {
        console.error('Canvas element with ID "ferrari-fxx-3d-canvas" not found.');
        return;
    }

    // Check if WebGL is available
    if ( !window.WebGLRenderingContext ) {
        console.error('WebGL is not supported in this browser. The 3D model viewer will not work.');
        canvas.style.display = 'none'; // Hide the canvas if WebGL is not supported
        const message = document.createElement('p');
        message.textContent = 'Your browser does not support WebGL, so the 3D model cannot be displayed.';
        message.style.color = 'red';
        message.style.textAlign = 'center';
        message.style.marginTop = '20px';
        canvas.parentNode.insertBefore(message, canvas.nextSibling);
        return;
    }

    // camera
    // Using THREE.OrthographicCamera as provided, adjust parameters based on canvas size
    const camera = new THREE.OrthographicCamera(
        canvas.clientWidth / - 2,
        canvas.clientWidth / 2,
        canvas.clientHeight / 2,
        canvas.clientHeight / - 2,
        -50000, 10000
    );
    camera.position.set(0, 0, 0); // Default position, Spline scene might override or position its own camera
    // camera.quaternion.setFromEuler(new THREE.Euler(0, 0, 0)); // Spline scene typically manages its own camera rotation

    // scene
    const scene = new THREE.Scene();

    // renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio); // For sharper rendering on high-DPI screens
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // scene settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    scene.background = new THREE.Color('#2d2e32'); // Match your site's dark background
    renderer.setClearAlpha(1);

    // orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.125;

    // spline scene
    const loader = new SplineLoader();
    loader.load(
        'https://prod.spline.design/UXlxGLQCPFhTXJ44/scene.splinecode',
        (splineScene) => {
            scene.add(splineScene);
            // Optional: If Spline scene has its own camera, you might want to use it
            // if (splineScene.userData.camera) {
            //     camera = splineScene.userData.camera;
            //     controls.object = camera; // Update OrbitControls to use Spline's camera
            // }
            console.log('Spline scene loaded successfully!');
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened loading the Spline scene:', error);
            showMessage('Failed to load 3D model. Please try again later.', 'error');
        }
    );

    // Responsive resizing
    const onWindowResize = () => {
        // Update canvas actual dimensions
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        camera.left = canvas.clientWidth / - 2;
        camera.right = canvas.clientWidth / 2;
        camera.top = canvas.clientHeight / 2;
        camera.bottom = canvas.clientHeight / - 2;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    // Initial resize call
    onWindowResize();
    window.addEventListener('resize', onWindowResize);

    // Animation loop
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update(); // Only needed if controls.enableDamping is true
        renderer.render(scene, camera);
    };
    animate(); // Start the animation loop
};

// Initialize the Ferrari FXX 3D viewer on window load
window.addEventListener('load', initFerrariFXX3DViewer);


// --- Lottie Animation Initialization ---
const initLottieAnimation = () => {
    const lottiePlayer = document.getElementById('lottie-tech-animation');
    if (lottiePlayer) {
        lottiePlayer.play();
    }
};
window.addEventListener('load', initLottieAnimation);


// --- "My Forbidden Garage" (Saved Cars) Functionality ---
const loadSavedCars = async () => {
    const savedCarsListDiv = document.getElementById('saved-cars-list');
    if (!isAuthReady || !db || !userId) {
        savedCarsListDiv.innerHTML = '<p class="text-text-body md:col-span-3">Please sign in to view your garage.</p>';
        return;
    }

    const userGarageRef = doc(db, `artifacts/${appId}/users/${userId}/myGarage`, 'savedCars');

    try {
        const docSnap = await getDoc(userGarageRef);
        let savedCarIds = [];
        if (docSnap.exists()) {
            savedCarIds = docSnap.data().cars || [];
        }

        if (savedCarIds.length === 0) {
            savedCarsListDiv.innerHTML = '<p class="text-text-body md:col-span-3">Your garage is empty. Save some cars!</p>';
            return;
        }

        // Map car IDs to their display names (you might store this in a global object or fetch from a cars collection)
        const carDisplayNames = {
            'ferrari-fxx': 'Ferrari FXX / FXX-K Evo',
            'pagani-zonda-r': 'Pagani Zonda R / Revolucion',
            'lamborghini-sesto-elemento': 'Lamborghini Sesto Elemento',
            'aston-martin-vulcan': 'Aston Martin Vulcan',
            'bugatti-bolide': 'Bugatti Bolide',
            'mclaren-gtr': 'McLaren P1 GTR / Senna GTR',
            'mercedes-clk-gtr': 'Mercedes-Benz CLK GTR Straßenversion',
            'tvr-cerbera-speed-12': 'TVR Cerbera Speed 12',
            'jaguar-xj220s': 'Jaguar XJ220S',
            'lamborghini-strosek-diablo': 'Lamborghini Strosek Diablo'
        };

        savedCarsListDiv.innerHTML = savedCarIds.map(carId => `
            <a href="#${carId}" class="group card overflow-hidden block" aria-label="View saved car ${carDisplayNames[carId]}">
                <img class="lazy-load w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300" data-src="https://placehold.co/600x400/3a3a3a/e0e0e0?text=${encodeURIComponent(carDisplayNames[carId].replace(/ /g, '+'))}" alt="${carDisplayNames[carId]}">
                <div class="p-6">
                    <h3 class="text-xl md:text-2xl font-roboto-condensed text-white mb-2">${carDisplayNames[carId]}</h3>
                    <div class="text-primary-accent text-lg font-bold group-hover:underline transition-all duration-300">
                        View Details <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true"></i>
                    </div>
                </div>
            </a>
        `).join('');

        // Re-initialize lazy loading for newly added images
        lazyLoadImages();

    } catch (error) {
        console.error("Error loading saved cars:", error);
        savedCarsListDiv.innerHTML = '<p class="text-text-body md:col-span-3">Error loading your garage. Please try again.</p>';
    }
};

// --- Comment Section Functionality (for Ferrari FXX as example) ---
const loadComments = (carId) => {
    if (!isAuthReady || !db) {
        console.log("Firestore not ready, cannot load comments.");
        return;
    }

    const commentsListDiv = document.getElementById(`${carId}-comments-list`);
    if (!commentsListDiv) return;

    const commentsCollectionRef = collection(db, `artifacts/${appId}/public/data/carComments/${carId}/comments`);
    const q = query(commentsCollectionRef);

    onSnapshot(q, (snapshot) => {
        commentsListDiv.innerHTML = ''; // Clear existing comments
        if (snapshot.empty) {
            commentsListDiv.innerHTML = '<p class="text-text-body text-center">No comments yet. Be the first!</p>';
            return;
        }
        const comments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            comments.push({ id: doc.id, ...data });
        });

        // Sort comments by timestamp in memory (since orderBy is avoided in query)
        comments.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'bg-background p-4 rounded-lg border border-card-border';
            const date = comment.timestamp ? new Date(comment.timestamp.toMillis()).toLocaleString() : 'Just now';
            const displayUserId = comment.userId ? `${comment.userId.substring(0, 8)}...${comment.userId.substring(comment.userId.length - 4)}` : 'Anonymous';
            commentElement.innerHTML = `
                <p class="text-text-body text-sm mb-1">
                    <span class="font-bold text-primary-accent">${displayUserId}</span>
                    <span class="text-xs text-gray-500 ml-2">${date}</span>
                </p>
                <p class="text-white text-base md:text-lg">${comment.text}</p>
            `;
            commentsListDiv.appendChild(commentElement);
        });
    }, (error) => {
        console.error(`Error loading comments for ${carId}:`, error);
        commentsListDiv.innerHTML = '<p class="text-text-body text-center">Error loading comments.</p>';
    });
};

const postComment = async (carId) => {
    if (!isAuthReady || !db || !userId) {
        showMessage("Please sign in to post a comment.", "error");
        return;
    }

    const commentInput = document.getElementById(`${carId}-comment-input`);
    const commentText = commentInput.value.trim();

    if (commentText === '') {
        showMessage("Comment cannot be empty.", "error");
        return;
    }

    try {
        const commentsCollectionRef = collection(db, `artifacts/${appId}/public/data/carComments/${carId}/comments`);
        await addDoc(commentsCollectionRef, {
            userId: userId,
            text: commentText,
            timestamp: serverTimestamp()
        });
        commentInput.value = ''; // Clear input
        showMessage("Comment posted successfully!", "success");
    } catch (error) {
        console.error("Error posting comment:", error);
        showMessage("Failed to post comment.", "error");
    }
};

// Attach event listener for Ferrari FXX comment button
const ferrariFXXPostCommentButton = document.getElementById('ferrari-fxx-post-comment');
if (ferrariFXXPostCommentButton) {
    ferrariFXXPostCommentButton.addEventListener('click', () => postComment('ferrari-fxx'));
}

// --- Lazy Loading Images ---
const lazyLoadImages = () => {
    const lazyImages = document.querySelectorAll('img.lazy-load');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy-load');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '0px 0px 100px 0px' // Load images when they are 100px from viewport
    });

    lazyImages.forEach(img => {
        observer.observe(img);
    });
};

// Call lazy loading on page load
window.addEventListener('load', lazyLoadImages);
