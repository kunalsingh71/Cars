document.addEventListener("DOMContentLoaded", function () {
    // 1️⃣ Welcome Alert
    alert("Welcome to the Supercars Showcase!");

    // 2️⃣ Smooth Scrolling Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute("href")).scrollIntoView({ behavior: "smooth" });
        });
    });

    // 3️⃣ Login Form Validation
    document.querySelector("#loginForm")?.addEventListener("submit", function (e) {
        let username = document.querySelector("#loginUsername").value;
        let password = document.querySelector("#loginPassword").value;
        if (username === "" || password === "") {
            alert("Please fill in all fields!");
            e.preventDefault();
        }
    });

    // 4️⃣ Sign-Up Form Validation
    document.querySelector("#signupForm")?.addEventListener("submit", function (e) {
        let email = document.querySelector("#signupEmail").value;
        if (!email.includes("@")) {
            alert("Enter a valid email address!");
            e.preventDefault();
        }
    });

    // 5️⃣ Dark Mode Toggle
    document.querySelector("#darkModeToggle")?.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");
    });

    // 6️⃣ Auto-Scrolling Slider
    let slideIndex = 0;
    function autoSlide() {
        let slides = document.querySelectorAll(".slides img");
        slides.forEach(slide => slide.style.display = "none");
        slideIndex = (slideIndex + 1) % slides.length;
        slides[slideIndex].style.display = "block";
        setTimeout(autoSlide, 3000);
    }
    autoSlide();

    // 7️⃣ Image Hover Zoom Effect
    document.querySelectorAll(".slides img").forEach(img => {
        img.addEventListener("mouseover", function () {
            this.style.transform = "scale(1.1)";
        });
        img.addEventListener("mouseleave", function () {
            this.style.transform = "scale(1)";
        });
    });

    // 8️⃣ Show Password Toggle
    document.querySelectorAll(".password-toggle").forEach(toggle => {
        toggle.addEventListener("click", function () {
            let passwordField = document.querySelector(this.dataset.target);
            passwordField.type = passwordField.type === "password" ? "text" : "password";
        });
    });

    // 9️⃣ Typing Animation
    let text = "Welcome to the Supercars World!";
    let i = 0;
    function typeEffect() {
        if (i < text.length) {
            document.querySelector("#typingText").innerHTML += text.charAt(i);
            i++;
            setTimeout(typeEffect, 100);
        }
    }
    typeEffect();

    // 🔟 Animated Button Click Effects
    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", function () {
            this.classList.add("clicked");
            setTimeout(() => this.classList.remove("clicked"), 300);
        });
    });

    // 1️⃣1️⃣ Parallax Scrolling Effect
    window.addEventListener("scroll", function () {
        let offset = window.scrollY;
        document.querySelector(".slider").style.backgroundPositionY = offset * 0.5 + "px";
    });

    // 1️⃣2️⃣ Animated Menu Toggle
    document.querySelector("#menuToggle")?.addEventListener("click", function () {
        document.querySelector(".menu").classList.toggle("active");
    });
});

