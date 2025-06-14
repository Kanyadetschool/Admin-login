const studentImages = {
    'B006458470': 'images/ODHIAMBO AFFLINE ATIENO.jpg',
    'B006458486': 'images/FRANKLINE LEONE.jpg',
    'B006578343': 'images/JANE ELIZABETH.jpg',
    'ST004': 'images/students/student4.jpg',
    // Add more student images as needed
};

const defaultStudentImage = 'images/default-student.png';

class StudentImageManager {
    static getStudentImage(studentId) {
        return studentImages[studentId] || defaultStudentImage;
    }

    static renderStudentImage(studentId, element, status = 'active') {
        const imageContainer = document.createElement('div');
        imageContainer.className = 'student-image-container';
        
        const img = document.createElement('img');
        img.src = this.getStudentImage(studentId);
        img.alt = 'Student Photo';
        img.className = 'student-image';
        img.onerror = () => {
            img.src = defaultStudentImage;
        };
        
        const statusElement = document.createElement('div');
        statusElement.className = `student-status status-${status.toLowerCase()}`;
        statusElement.textContent = status;
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(statusElement);
        element.insertBefore(imageContainer, element.firstChild);
        
        return imageContainer;
    }
}

window.StudentImageManager = StudentImageManager;