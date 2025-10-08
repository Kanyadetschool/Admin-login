  

// Get the grid element
const grid = document.querySelector('.grid');

// Hide grid by default
grid.style.display = 'none';

// Create toggle button
const toggleBtn = document.createElement('button');
toggleBtn.textContent = 'Show Content';
toggleBtn.style.cssText = `
  padding: 10px 20px;
  margin-left: 20px ! important;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s;
`;

toggleBtn.addEventListener('mouseenter', () => {
  toggleBtn.style.background = '#2563eb';
});

toggleBtn.addEventListener('mouseleave', () => {
  toggleBtn.style.background = '#3b82f6';
});

// Insert button before grid
grid.parentNode.insertBefore(toggleBtn, grid);

// Toggle function
let isVisible = false;

toggleBtn.addEventListener('click', () => {
  if (isVisible) {
    // Hide content
    grid.style.display = 'none';
    toggleBtn.textContent = 'Show Content';
  } else {
    // Show content
    grid.style.display = 'grid';
    toggleBtn.textContent = 'Hide Content';
  }
  isVisible = !isVisible;
});

