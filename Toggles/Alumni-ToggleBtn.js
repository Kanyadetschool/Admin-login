// script.js

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('Alumni-ToggleBtn');
    const linkModal = document.getElementById('linkModal');
    const modalContent = document.getElementById('modalContent');
    const links = [

        { text: '👨‍⚕️Alumni Biodata', url: '../New-Students-Database/Alumni-Biodata.html' },
        { text: '👨‍⚕️Alumni Biodata DB', url: '../New-Students-Database/Alumni-database.html' },
        { text: '🧑‍⚕️Edit Alumni Biodata ALL', url: '../New-Students-Database/Missing-Fields/All-missing-Fields/Alumni.html' },
       
       
    ];

    const buildModal = () => {
        modalContent.innerHTML = `
            <div class="modal-header">
      <i class='bx bxs-book'></i>

                <h2>Alumni Student Portals </h2>
                <button id="closeModalBtn" class="close-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" class="close-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div id="linksContainer" class="links-container"></div>

                  <div class="modal-header2">

                <h2>  </h2>
              
            </div>
           
        `;

        // Populate links
        const linksContainer = modalContent.querySelector('#linksContainer');
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.textContent = link.text;
            a.className = 'link-item';
            linksContainer.appendChild(a);
        });

        // Close button action
        modalContent.querySelector('#closeModalBtn').addEventListener('click', () => {
            linkModal.classList.add('hidden');
        });
    };

    toggleBtn.addEventListener('click', () => {
        buildModal();
        linkModal.classList.remove('hidden');
    });

    // Close modal on outside click
    linkModal.addEventListener('click', (event) => {
        if (!modalContent.contains(event.target)) {
            linkModal.classList.add('hidden');
        }
    });
});