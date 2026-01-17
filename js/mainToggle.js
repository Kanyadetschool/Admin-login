// script.js

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggleBtn');
    const linkModal = document.getElementById('linkModal');
    const modalContent = document.getElementById('modalContent');

    const links = [
        { text: '👨‍⚕️Kjsea & Kpsea Results', url: 'https://kanyadet-school-admin.web.app/Kjsea-Kpsea/Teachers-Kjsea-Results.html' },
        { text: '👨‍⚕️Upload Results', url: 'https://kanyadet-school-admin.web.app/Report-Cards/Results.html' },
        { text: '🧑‍⚕️Junior School', url: '../Report-Cards/Reports-Cards-Junior-School.html' },
        { text: '🧑‍⚕️upper Primary School', url: '../Report-Cards/Reports-Cards-Upper-Primary.html' },
        { text: '👶lower Primary School', url: '../Report-Cards/Reports-Cards-lower-Primary.html' },
        { text: '🔍All in One Report Cards', url: '../Report-Cards/All-Report-cards.html' },
       
    ];

    const buildModal = () => {
        modalContent.innerHTML = `
            <div class="modal-header">
      <i class='bx bxs-book'></i>

                <h2>Performance Report</h2>
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