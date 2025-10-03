// hide sides bar by default in all screens
// const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

// // Sidebar element
// const sidebar = document.getElementById('sidebar');

// // 🔹 Hide sidebar by default
// sidebar.classList.add('hide');

// // Loop through menu items
// allSideMenu.forEach(item => {
// 	const li = item.parentElement;

// 	item.addEventListener('click', function () {
// 		// Remove active from all
// 		allSideMenu.forEach(i => {
// 			i.parentElement.classList.remove('active');
// 		});

// 		// Add active to clicked one
// 		li.classList.add('active');

// 		// Hide sidebar after clicking
// 		sidebar.classList.add('hide');
// 	});
// });

// // TOGGLE SIDEBAR
// const menuBar = document.querySelector('.bx.bx-menu');

// menuBar.addEventListener('click', function () {
// 	sidebar.classList.toggle('hide');
// });














//  hide sides bar by default in small screens only so u can pick ur choice the top one or this

const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
const sidebar = document.getElementById('sidebar');
const menuBar = document.querySelector('.bx.bx-menu');

// 🔹 Function to set sidebar visibility based on screen size
function setSidebarDefault() {
  if (window.innerWidth < 1024) {  
    // Small & medium screens (< 1024px)
    sidebar.classList.add('hide');
  } else {
    // Large screens (>= 1024px)
    sidebar.classList.remove('hide');
  }
}

// Run on load
setSidebarDefault();

// Run on window resize
window.addEventListener('resize', setSidebarDefault);

// Loop through menu items
allSideMenu.forEach(item => {
  const li = item.parentElement;

  item.addEventListener('click', function () {
    allSideMenu.forEach(i => i.parentElement.classList.remove('active'));
    li.classList.add('active');

    // Auto-hide only on small screens
    if (window.innerWidth < 1024) {
      sidebar.classList.add('hide');
    }
  });
});

// TOGGLE SIDEBAR
menuBar.addEventListener('click', function () {
  sidebar.classList.toggle('hide');
});






const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
	if(window.innerWidth < 576) {
		e.preventDefault();
		searchForm.classList.toggle('show');
		if(searchForm.classList.contains('show')) {
			searchButtonIcon.classList.replace('bx-search', 'bx-x');
		} else {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
		}
	}
})





if(window.innerWidth < 768) {
	sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
	searchButtonIcon.classList.replace('bx-x', 'bx-search');
	searchForm.classList.remove('show');
}


window.addEventListener('resize', function () {
	if(this.innerWidth > 576) {
		searchButtonIcon.classList.replace('bx-x', 'bx-search');
		searchForm.classList.remove('show');
	}
})



const switchMode = document.getElementById('switch-mode');

switchMode.addEventListener('change', function () {
	if(this.checked) {
		document.body.classList.add('dark');
	} else {
		document.body.classList.remove('dark');
	}
})

// Enhanced dark mode switch handler
switchMode.addEventListener('change', function () {
    const headers = document.querySelectorAll('.order .head, .order table thead');
    const headerCells = document.querySelectorAll('.order table thead th');
    
    if (this.checked) {
        document.body.classList.add('dark');
        headers.forEach(header => {
            header.style.transition = 'all 0.3s ease';
            header.style.opacity = '0';
            setTimeout(() => {
                header.style.opacity = '1';
            }, 50);
        });
        
        // Add shimmer effect to header cells
        headerCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.transition = 'all 0.3s ease';
                cell.style.opacity = '0';
                setTimeout(() => {
                    cell.style.opacity = '1';
                }, 50);
            }, index * 50);
        });
    } else {
        document.body.classList.remove('dark');
        headers.forEach(header => {
            header.style.transition = 'all 0.3s ease';
        });
    }
});

// Add sorting indicator and active state
document.querySelectorAll('.order table thead th').forEach(th => {
    th.addEventListener('click', () => {
        document.querySelectorAll('.order table thead th').forEach(cell => {
            cell.classList.remove('active');
        });
        th.classList.add('active');
    });
});


// DOM Elements
const searchInput = document.querySelector('.form-input input');
const admissionsTable = document.querySelector('.order table tbody');
const addAdmissionBtn = document.createElement('button');
const sortButton = document.createElement('button');
sortButton.innerHTML = '<i class="bx bx-sort-alt-2"></i>';
sortButton.style.cssText = `
    padding: 8px 12px;
    background: #3C91E6;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 16px;
    transition: all 0.3s ease;
`;

// Add hover effect
sortButton.addEventListener('mouseenter', () => {
    sortButton.style.background = '#2a74c2';
});

sortButton.addEventListener('mouseleave', () => {
    sortButton.style.background = '#3C91E6';
});

// Add responsive styles
function updateSortButtonSize() {
    if (window.innerWidth < 768) {
        sortButton.style.padding = '6px 10px';
        sortButton.style.fontSize = '14px';
    } else {
        sortButton.style.padding = '8px 12px';
        sortButton.style.fontSize = '16px';
    }
}

// Initial call
updateSortButtonSize();

// Update on window resize
window.addEventListener('resize', updateSortButtonSize);

document.querySelector('.order .head').appendChild(sortButton);