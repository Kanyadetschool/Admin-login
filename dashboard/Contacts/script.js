let next = document.querySelector('.next')
let prev = document.querySelector('.prev')
let autoScrollInterval;
let isAutoScrolling = false;

function nextSlide() {
    let items = document.querySelectorAll('.item')
    document.querySelector('.slide').appendChild(items[0])
}

function prevSlide() {
    let items = document.querySelectorAll('.item')
    document.querySelector('.slide').prepend(items[items.length - 1])
}

// Remove container hover events and add button hover events
const seeMoreButtons = document.querySelectorAll('.content button');

seeMoreButtons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        stopAutoScroll();
    });

    button.addEventListener('mouseleave', function() {
        startAutoScroll();
    });
});

function startAutoScroll() {
    if (!isAutoScrolling) {
        isAutoScrolling = true;
        autoScrollInterval = setInterval(nextSlide, 8000);
    }
}

function stopAutoScroll() {
    if (isAutoScrolling) {
        isAutoScrolling = false;
        clearInterval(autoScrollInterval);
    }
}

next.addEventListener('click', function(){
    stopAutoScroll();
    nextSlide();
})

prev.addEventListener('click', function(){
    stopAutoScroll();
    prevSlide();
})

// Start auto-scroll on page load
startAutoScroll();

// Optional: Add play/pause button event listener
document.addEventListener('keypress', function(e) {
    if (e.code === 'Space') {
        isAutoScrolling ? stopAutoScroll() : startAutoScroll();
    }
});

// Add touch support
let touchStartX = 0;
let touchEndX = 0;

document.querySelector('.container').addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoScroll();
});

document.querySelector('.container').addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
    startAutoScroll();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextSlide(); // Swipe left
        } else {
            prevSlide(); // Swipe right
        }
    }
}

// Add resize handler
window.addEventListener('resize', () => {
    // Reset any transform styles that might break layout on resize
    document.querySelectorAll('.item').forEach(item => {
        item.style.transition = 'none';
    });
    
    // Re-enable transitions after a brief delay
    setTimeout(() => {
        document.querySelectorAll('.item').forEach(item => {
            item.style.transition = '0.5s';
        });
    }, 100);
});