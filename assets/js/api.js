const API_URL = 'https://chel.qzz.io/api.php';
const BASE_URL = 'https://chel.qzz.io';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (path.includes('project.html') && slug) {
        fetchProjectDetail(slug);
    } else if (path.includes('certif.html') && slug) {
        fetchCertifDetail(slug);
    } else {
        fetchData();
    }
});

async function fetchProjectDetail(slug) {
    try {
        const response = await fetch(`${API_URL}?action=project_html&slug=${slug}`);
        const json = await response.json();
        const container = document.getElementById('dynamic-content');
        if (json.status === 'success' && container) {
            container.innerHTML = json.html;
            document.title = json.title + ' | Portfolio';
            
            // Re-evaluate scripts that might be inside the injected HTML
            const scripts = container.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        } else if (container) {
            container.innerHTML = `<div class="text-center py-32"><h1 class="text-4xl font-bold">Project Not Found</h1><a href="index.html" class="text-brand-accent mt-4 inline-block">Return to Home</a></div>`;
        }
    } catch (error) {
        console.error('Error fetching project detail:', error);
    }
}

async function fetchCertifDetail(slug) {
    try {
        const response = await fetch(`${API_URL}?action=certif_html&slug=${slug}`);
        const json = await response.json();
        const container = document.getElementById('dynamic-content');
        if (json.status === 'success' && container) {
            container.innerHTML = json.html;
            document.title = json.title + ' | Certificate';
        } else if (container) {
            container.innerHTML = `<div class="text-center py-32"><h1 class="text-4xl font-bold">Certificate Not Found</h1><a href="index.html" class="text-brand-accent mt-4 inline-block">Return to Home</a></div>`;
        }
    } catch (error) {
        console.error('Error fetching certif detail:', error);
    }
}

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        
        if (json.status === 'success') {
            const data = json.data;
            updateSettings(data.settings);
            updateSkills(data.skills);
            updateProjects(data.projects, data.categories);
            updateCertificates(data.certificates);
        }
    } catch (error) {
        console.error('Error fetching data from API:', error);
    }
}

function updateSettings(settings) {
    // We update basic text elements if they exist
    const bioElement = document.querySelector('#hero p.text-lg');
    if (bioElement && settings.about_bio) {
        bioElement.textContent = settings.about_bio;
    }
    
    // Update about text
    const aboutContainer = document.querySelector('#about-me .prose');
    if (aboutContainer && settings.about_text) {
        const paragraphs = settings.about_text.split('\n\n');
        aboutContainer.innerHTML = '';
        paragraphs.forEach(p => {
            if (p.trim()) {
                const pEl = document.createElement('p');
                pEl.className = 'text-left md:text-justify text-brand-inkmuted';
                pEl.innerHTML = p.trim().replace(/\n/g, '<br>');
                aboutContainer.appendChild(pEl);
            }
        });
    }
}

function updateSkills(groupedSkills) {
    const skillsContainer = document.querySelector('#about .space-y-16');
    if (!skillsContainer) return;
    
    const skillCategories = {
        'Development': 'brand-accent',
        'Hardware': 'brand-accentdark',
        'AI & Data': 'brand-accent',
        'Technical': 'brand-accentdark',
        'Design': 'brand-accent'
    };
    
    let html = '';
    
    for (const [catName, colorClass] of Object.entries(skillCategories)) {
        if (groupedSkills[catName]) {
            html += `
            <div class="reveal-up">
                <h3 class="text-2xl font-heading font-bold text-brand-ink mb-8 flex items-center">
                    <span class="w-2 h-8 bg-${colorClass} mr-3 rounded-full shadow-[0_0_10px_var(--tw-shadow-color)] shadow-${colorClass}/50"></span>
                    ${catName}
                </h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 xl:gap-8">`;
                
            groupedSkills[catName].forEach(skill => {
                const circumference = 2 * Math.PI * 36;
                const offset = circumference - (skill.percentage / 100) * circumference;
                
                html += `
                    <div class="flex flex-col items-center justify-center bg-brand-surface p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-bgalt hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 group">
                        <div class="relative w-24 h-24 mb-5">
                            <svg class="w-24 h-24 transform -rotate-90">
                                <circle cx="48" cy="48" r="36" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-100" />
                                <circle cx="48" cy="48" r="36" stroke="currentColor" stroke-width="8" fill="transparent" stroke-linecap="round"
                                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                                    class="text-${colorClass} progress-circle transition-all duration-1500 ease-out drop-shadow-md" />
                            </svg>
                            <div class="absolute inset-0 flex flex-col items-center justify-center">
                                <span class="text-lg font-bold text-brand-ink group-hover:text-${colorClass} transition-colors">${skill.percentage}%</span>
                            </div>
                        </div>
                        <span class="text-sm font-bold text-brand-inkmuted text-center leading-tight group-hover:text-${colorClass} transition-colors">${skill.name}</span>
                    </div>`;
            });
            
            html += `</div></div>`;
        }
    }
    
    // Add 'Other' category if exists
    if (groupedSkills['Other']) {
        html += `
        <div class="reveal-up mt-16 pt-12 border-t border-black/5">
            <h3 class="text-2xl md:text-3xl font-heading font-bold text-brand-ink mb-10 flex flex-col items-center justify-center text-center">
                <span class="w-12 h-1 bg-gradient-to-r from-gray-500 to-brand-accent rounded-full mb-4"></span>
                Additional Tools & Concepts
            </h3>
            <div class="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">`;
            
        groupedSkills['Other'].forEach(skill => {
            html += `
                <div class="glass-card px-5 py-3 rounded-xl flex items-center gap-3 hover:border-brand-accent/40 hover:bg-brand-accent/10 hover:-translate-y-1 transition-all duration-300 group cursor-default shadow-lg hover:shadow-[0_10px_20px_rgba(37,99,235,0.15)]">
                    ${skill.icon ? `<span class="text-xl group-hover:scale-125 transition-transform">${skill.icon}</span>` : `<div class="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_8px_#2563EB]"></div>`}
                    <span class="font-medium text-brand-inkmuted group-hover:text-brand-ink transition-colors">${skill.name}</span>
                </div>`;
        });
        
        html += `</div></div>`;
    }
    
    skillsContainer.innerHTML = html;
}

function updateProjects(projects, categories) {
    // 1. Update Filters
    const filterContainer = document.querySelector('#projects .flex-wrap.gap-2');
    if (filterContainer) {
        let filterHtml = '<button class="filter-btn active px-5 py-2 rounded-full border border-brand-accent bg-brand-accent/10 text-brand-accent text-sm font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]" data-filter="all">All</button>';
        categories.forEach(cat => {
            filterHtml += `<button class="filter-btn px-5 py-2 rounded-full glass-card text-brand-inkmuted text-sm font-medium hover:border-brand-accent hover:text-brand-accent transition-all" data-filter="${cat.id}">${cat.name}</button>`;
        });
        filterContainer.innerHTML = filterHtml;
        
        // Re-attach filter listeners
        const btns = filterContainer.querySelectorAll('.filter-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => {
                    b.classList.remove('active', 'border', 'border-brand-accent', 'bg-brand-accent/10', 'text-brand-accent', 'shadow-[0_0_15px_rgba(37,99,235,0.2)]');
                    b.classList.add('glass-card', 'text-brand-inkmuted');
                });
                btn.classList.add('active', 'border', 'border-brand-accent', 'bg-brand-accent/10', 'text-brand-accent', 'shadow-[0_0_15px_rgba(37,99,235,0.2)]');
                btn.classList.remove('glass-card', 'text-brand-inkmuted');
                
                const filter = btn.getAttribute('data-filter');
                const items = document.querySelectorAll('.project-card');
                items.forEach(item => {
                    if(filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.style.display = 'flex';
                        setTimeout(() => item.style.opacity = '1', 50);
                    } else {
                        item.style.opacity = '0';
                        setTimeout(() => item.style.display = 'none', 300);
                    }
                });
            });
        });
    }

    // 2. Update Grid
    const gridContainer = document.getElementById('projects-grid');
    if (!gridContainer) return;
    
    let gridHtml = '';
    projects.forEach((project, index) => {
        let mediaHtml = '';
        if (project.thumbnail) {
            mediaHtml = `<img src="${BASE_URL}/${project.thumbnail}" alt="${project.title}" class="w-full h-full object-cover">`;
        } else if (project.video_preview) {
            mediaHtml = `<video autoplay loop muted playsinline class="w-full h-full object-cover"><source src="${BASE_URL}/${project.video_preview}" type="video/mp4"></video>`;
        } else {
            mediaHtml = `<div class="w-full h-full flex flex-col items-center justify-center text-brand-accent/50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGExMzIyIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMWUyOTNiIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')]"><svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div>`;
        }
        
        let techHtml = '';
        if (project.tech_stack) {
            try {
                const techs = JSON.parse(project.tech_stack);
                if (Array.isArray(techs)) {
                    techHtml = `<div class="flex flex-wrap gap-2 mb-8">`;
                    techs.slice(0, 3).forEach(tech => {
                        techHtml += `<span class="text-xs font-medium text-brand-inkmuted bg-brand-surface/5 border border-black/5 px-2.5 py-1 rounded-md">${tech}</span>`;
                    });
                    if (techs.length > 3) {
                        techHtml += `<span class="text-xs font-medium text-brand-accent px-2.5 py-1">+${techs.length - 3}</span>`;
                    }
                    techHtml += `</div>`;
                }
            } catch(e) {}
        }
        
        gridHtml += `
        <div class="project-card group bg-brand-surface rounded-3xl border border-brand-bgalt overflow-hidden transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-brand-accent/20 shadow-xl shadow-slate-200/50 flex flex-col h-full reveal-up" style="transition-delay: ${(index % 3) * 100}ms" data-category="${project.category_id}">
            <div class="h-64 bg-brand-bg relative overflow-hidden img-zoom-container">
                ${mediaHtml}
                <div class="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent opacity-90"></div>
                <div class="absolute top-4 right-4">
                    <span class="text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full bg-brand-bg/80 text-brand-accent border border-brand-accent/30 backdrop-blur-md uppercase">
                        ${project.category_name || ''}
                    </span>
                </div>
            </div>
            <div class="p-6 sm:p-8 flex-1 flex flex-col relative z-10">
                <h3 class="text-xl sm:text-2xl font-heading font-bold text-brand-ink mb-3 group-hover:text-brand-accent transition-colors line-clamp-2">${project.title}</h3>
                <p class="text-brand-inkmuted text-sm mb-6 line-clamp-3 leading-relaxed flex-1 font-light">${project.short_desc}</p>
                ${techHtml}
                <a href="project.html?slug=${project.slug}" class="inline-flex items-center text-sm font-bold text-brand-ink hover:text-brand-accent transition-colors mt-auto w-fit">
                    Explore Detail 
                    <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </a>
            </div>
        </div>`;
    });
    
    gridContainer.innerHTML = gridHtml;
}

function updateCertificates(certificates) {
    const certsContainer = document.querySelector('#certificates .grid');
    if (!certsContainer) return;
    
    let html = '';
    certificates.forEach((cert, index) => {
        let viewLinkHtml = cert.slug ? `
            <a href="certif.html?slug=${cert.slug}" class="inline-flex items-center text-sm font-bold text-brand-inkmuted hover:text-brand-ink transition-colors border-b border-gray-700 hover:border-white pb-1 w-fit mt-auto group-hover:text-brand-accentdark group-hover:border-brand-accentdark">
                View Certificate
                <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </a>` : '';
            
        html += `
        <div class="bg-brand-surface p-8 rounded-[2rem] border border-brand-bgalt shadow-xl shadow-slate-200/50 hover:border-brand-accentdark/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-accentdark/10 transition-all duration-500 group reveal-up" style="transition-delay: ${(index % 3) * 100}ms">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-accent/20 to-brand-accentdark/20 border border-brand-accentdark/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg class="w-7 h-7 text-brand-accentdark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
            </div>
            <h3 class="text-xl font-heading font-bold text-brand-ink mb-2 line-clamp-2 leading-tight group-hover:text-brand-accentdark transition-colors">${cert.title}</h3>
            <p class="text-brand-accent text-sm font-medium mb-1">${cert.issuer}</p>
            <p class="text-brand-inkfaint text-xs mb-6">${cert.issue_date}</p>
            ${viewLinkHtml}
        </div>`;
    });
    
    certsContainer.innerHTML = html;
}
