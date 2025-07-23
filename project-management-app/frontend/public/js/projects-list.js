// Projects list management
const ProjectsList = {
    // Initialize the projects list
    async init() {
        try {
            await this.loadProjects();
        } catch (error) {
            console.error('Failed to initialize projects list:', error);
            // Fallback to existing static data if API fails
        }
    },

    // Load projects from API
    async loadProjects(params = {}) {
        try {
            const response = await ApplicationAPI.getApplications(params);
            if (response && response.applications) {
                this.renderProjects(response.applications);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            throw error;
        }
    },

    // Render projects list
    renderProjects(applications) {
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) return;

        // Clear existing content except the search bar
        const searchContainer = projectsContainer.querySelector('.search-container');
        projectsContainer.innerHTML = '';
        if (searchContainer) {
            projectsContainer.appendChild(searchContainer);
        }

        // Render each application
        applications.forEach(app => {
            const projectCard = this.createProjectCard(app);
            projectsContainer.appendChild(projectCard);
        });
    },

    // Create project card element
    createProjectCard(application) {
        const card = document.createElement('a');
        card.href = `project-unified.html?edit=${application.id}`;
        card.className = 'block bg-white/70 backdrop-blur-sm rounded-xl border border-notion-gray-200/60 shadow-notion hover:shadow-notion-hover transition-all duration-300 p-6 group cursor-pointer';

        // Get family composition
        const familyComposition = this.getFamilyComposition(application.familyMembers || []);

        // Get status badge
        const statusBadge = this.getStatusBadge(application.status);

        // Get initials for avatar
        const initials = application.applicantName ? application.applicantName.charAt(0) : 'N';

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                        ${initials}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="text-lg font-semibold text-notion-gray-800">${application.applicantName || '未設定'}</h3>
                            ${statusBadge}
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-notion-gray-600">
                            <div>
                                <div class="text-xs text-notion-gray-500 mb-1">傷病名</div>
                                <div class="font-medium">${application.disabilityDescription || '未設定'}</div>
                            </div>
                            <div>
                                <div class="text-xs text-notion-gray-500 mb-1">年金種類</div>
                                <div class="font-medium">${this.getPensionType(application.applicationType)}</div>
                            </div>
                            <div>
                                <div class="text-xs text-notion-gray-500 mb-1">初診日</div>
                                <div class="font-medium">${this.formatDate(application.onsetDate)}</div>
                            </div>
                            <div>
                                <div class="text-xs text-notion-gray-500 mb-1">家族構成</div>
                                <div class="font-medium">${familyComposition}</div>
                            </div>
                            <div>
                                <div class="text-xs text-notion-gray-500 mb-1">見込み収益</div>
                                <div class="font-medium">${this.formatCurrency(application.monthlyAmount)}</div>
                            </div>
                        </div>
                        <div class="flex items-center mt-3 text-xs text-notion-gray-500">
                            <span>申請日: ${this.formatDate(application.createdAt)}</span>
                            <span class="mx-2">•</span>
                            <span>担当: ${application.assignee?.name || '未割当'}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button class="p-2 text-notion-gray-500 hover:text-notion-gray-700 hover:bg-notion-gray-100 rounded-lg transition-all duration-200" onclick="event.preventDefault(); viewApplication(${application.id})">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <button class="p-2 text-notion-gray-500 hover:text-notion-gray-700 hover:bg-notion-gray-100 rounded-lg transition-all duration-200" onclick="event.preventDefault(); editApplication(${application.id})">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        return card;
    },

    // Get family composition string
    getFamilyComposition(familyMembers) {
        if (!familyMembers || familyMembers.length === 0) {
            return '配偶者無・子0名';
        }

        const spouse = familyMembers.find(m => m.memberType === 'spouse');
        const children = familyMembers.filter(m => m.memberType === 'child');

        const spouseText = spouse ? '配偶者有' : '配偶者無';
        const childrenText = `子${children.length}名`;

        return `${spouseText}・${childrenText}`;
    },

    // Get status badge HTML
    getStatusBadge(status) {
        const statusMap = {
            'draft': { text: '下書き', class: 'bg-gray-100 text-gray-800 border-gray-200' },
            'submitted': { text: '提出済み', class: 'bg-blue-100 text-blue-800 border-blue-200' },
            'under_review': { text: '審査中', class: 'bg-orange-100 text-orange-800 border-orange-200' },
            'additional_docs_required': { text: '追加書類要求', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            'approved': { text: '承認済み', class: 'bg-green-100 text-green-800 border-green-200' },
            'rejected': { text: '却下', class: 'bg-red-100 text-red-800 border-red-200' },
            'withdrawn': { text: '取下げ', class: 'bg-gray-100 text-gray-800 border-gray-200' }
        };

        const statusInfo = statusMap[status] || statusMap['draft'];
        return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.class}">${statusInfo.text}</span>`;
    },

    // Get pension type display name
    getPensionType(applicationType) {
        const typeMap = {
            'new': '新規申請',
            'renewal': '更新申請',
            'grade_change': '等級変更',
            'appeal': '不服申立て'
        };
        return typeMap[applicationType] || '未設定';
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '未設定';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },

    // Format currency
    formatCurrency(amount) {
        if (!amount) return '未設定';
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            maximumFractionDigits: 0
        }).format(amount);
    }
};

// Action handlers
function viewApplication(id) {
    window.location.href = `project-unified.html?edit=${id}`;
}

function editApplication(id) {
    window.location.href = `project-unified.html?edit=${id}`;
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', handleSearch);
    }
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    
    const searchTerm = searchInput?.value || '';
    const statusFilter_value = statusFilter?.value || '';

    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter_value) params.status = statusFilter_value;

    ProjectsList.loadProjects(params);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the projects page
    if (window.location.pathname.includes('projects.html') || document.getElementById('projects-container')) {
        ProjectsList.init();
        setupSearch();
    }
});