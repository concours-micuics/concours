document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/1X0JnYmCThtz6sJab5gBTJFie3LHi4iN8EnxgURwHDng/edit?usp=sharing' ;
    const remainingCountSpan = document.querySelector('#remaining-count span');
    const podiumContainer = document.getElementById('podium');
    const leaderboardList = document.getElementById('leaderboard-list');

    // --- Références modifiables pour les lots du podium ---
    // Modifiez ces valeurs ici (facilement remplaçables)
    const podiumReferences = ['Projecteur NeoPix 140 HD', 'Air Fryer MEDEK RA610DV 6L', ''];

    // --- POPUP: affiché à chaque ouverture ---
    const popupModal = document.getElementById('popupModal');
    const popupClose = document.getElementById('popupClose');

    function closePopup() {
        if (!popupModal) return;
        popupModal.classList.add('hidden');
        popupModal.setAttribute('aria-hidden', 'true');
    }

    if (popupClose && popupModal) {
        // focus pour accessibilité
        popupClose.focus();

        popupClose.addEventListener('click', () => {
            closePopup();
        });

        // Fermeture en cliquant sur l'arrière-plan
        popupModal.addEventListener('click', (e) => {
            if (e.target === popupModal) closePopup();
        });

        // Fermeture avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !popupModal.classList.contains('hidden')) {
                closePopup();
            }
        });
    }

    // Animation de comptage pour le score
    function animateCountUp(element, target) {
        let current = 0;
        const duration = 1500; // en millisecondes
        const increment = target / (duration / 16); // 16ms ~ 60fps

        function updateCount() {
            current += increment;
            if (current < target) {
                element.textContent = Math.ceil(current);
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = target;
            }
        }
        requestAnimationFrame(updateCount);
    }

    async function fetchDataAndBuildLeaderboard() {
        try {
            // Ajout d'un timestamp pour forcer le rechargement du fichier et éviter le cache du navigateur
            const response = await fetch(csvUrl + '&timestamp=' + new Date().getTime());
            if (!response.ok) {
                throw new Error('Erreur réseau lors de la récupération des données.');
            }
            const csvData = await response.text();
            
            const rows = csvData.split('\n').filter(row => row.trim() !== '');

            // Extraction de la valeur que vous avez mise en D4 dans Google Sheets
            const remainingValueRow = rows[3].split(',');
            const d4Content = remainingValueRow[3] ? remainingValueRow[3].trim().replace(/"/g, '') : ''; // Nettoie le contenu

            // On vérifie si le contenu est un nombre
            if (!isNaN(parseInt(d4Content))) {
                // Si c'est un nombre, on lance l'animation
                const remainingCount = parseInt(d4Content);
                animateCountUp(remainingCountSpan, remainingCount);
            } else {
                // Sinon, on affiche directement le texte
                remainingCountSpan.textContent = d4Content;
            }
            
            // Traitement des participants
            const participants = rows.slice(1).map(row => {
                const [name, scoreStr] = row.split(',');
                if (name && !isNaN(parseInt(scoreStr))) {
                    return { name: name.trim(), score: parseInt(scoreStr.trim()) };
                }
                return null;
            }).filter(p => p !== null);

            participants.sort((a, b) => b.score - a.score);

            podiumContainer.innerHTML = '';
            leaderboardList.innerHTML = '';

            buildPodium(participants.slice(0, 3));
            buildList(participants.slice(3));

        } catch (error) {
            console.error('Impossible de charger le classement :', error);
            remainingCountSpan.textContent = 'Erreur';
        }
    }

    function buildPodium(topThree) {
        const medalInfo = [
            { class: 'gold', image: 'np.png' },
            { class: 'silver', image: 'af.png' },
            { class: 'bronze', image: 'c.png' }
        ];

        topThree.forEach((participant, index) => {
            const placeDiv = document.createElement('div');
            placeDiv.className = `podium-place ${medalInfo[index].class}`;
            placeDiv.style.animationDelay = `${index * 0.2}s`;
            
            // Ajout du numéro de position (div.podium-rank)
            placeDiv.innerHTML = `
                <div class="podium-rank">${index + 1}</div>
                <div class="img-wrapper">
                    <img src="${medalInfo[index].image}" alt="Lot pour la ${index + 1}ère place">
                    <button class="info-icon" aria-label="Informations sur le produit" aria-expanded="false">i</button>
                    <div class="info-tooltip">${podiumReferences[index] || ('référence' + (index + 1))}</div>
                </div>
                <h3>${participant.name}</h3>
                <div class="score">${participant.score}</div>
            `;
            podiumContainer.appendChild(placeDiv);
        });
    }

    function buildList(restOfParticipants) {
        restOfParticipants.forEach((participant, index) => {
            const listItem = document.createElement('li');
            
            // Animation en cascade pour la liste
            listItem.style.animationDelay = `${(index * 0.05) + 0.5}s`;
            
            listItem.innerHTML = `
                <span class="rank">${index + 4}.</span>
                <span class="name">${participant.name}</span>
                <span class="score">${participant.score}</span>
            `;
            leaderboardList.appendChild(listItem);
        });
    }

    // Gestion des tooltips d'information (clic pour ouvrir/fermer, fermeture en cliquant ailleurs ou Échap)
    document.addEventListener('click', (e) => {
        const target = e.target;

        // Si on clique sur une info-icon
        if (target.classList && target.classList.contains('info-icon')) {
            const tooltip = target.nextElementSibling;
            if (!tooltip) return;
            const isShown = tooltip.classList.contains('show');
            // Fermer toutes les tooltips ouvertes
            document.querySelectorAll('.info-tooltip.show').forEach(t => {
                t.classList.remove('show');
                const btn = t.previousElementSibling;
                if (btn && btn.classList) btn.setAttribute('aria-expanded', 'false');
            });
            // Basculer l'état pour le tooltip cliqué
            if (!isShown) {
                tooltip.classList.add('show');
                target.setAttribute('aria-expanded', 'true');
            } else {
                tooltip.classList.remove('show');
                target.setAttribute('aria-expanded', 'false');
            }
            return;
        }

        // Si on clique en dehors d'une info-icon/tooltip, fermer toutes les tooltips
        if (!target.classList || (!target.classList.contains('info-tooltip') && !target.classList.contains('info-icon'))) {
            document.querySelectorAll('.info-tooltip.show').forEach(t => {
                t.classList.remove('show');
                const btn = t.previousElementSibling;
                if (btn && btn.classList) btn.setAttribute('aria-expanded', 'false');
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.info-tooltip.show').forEach(t => {
                t.classList.remove('show');
                const btn = t.previousElementSibling;
                if (btn && btn.classList) btn.setAttribute('aria-expanded', 'false');
            });
        }
    });

    fetchDataAndBuildLeaderboard();

});
