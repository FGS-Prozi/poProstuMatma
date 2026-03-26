const NOTES_DATA = [
      {
        group: '0. Szkoła podstawowa',
        items: [
          {
            title: 'Ułamki',
            desc: 'Czym są ułamki? Podstawowe operacje na ułamkach.',
            file: '../assets/notes/NT - Ułamki zwykłe, mieszane i dziesiętne.pdf'
          },
          {
            title: 'Równania',
            desc: 'TBD',
            file: '../assets/notes/TBD'
          },
          {
            title: 'Procenty',
            desc: 'TBD',
            file: '../assets/notes/TBD'
          },
          {
            title: 'Wyrażenia algebraiczne',
            desc: 'TBD',
            file: '../assets/notes/TBD'
          },
          {
            title: 'Wartość bezwzględna',
            desc: 'TBD',
            file: '../assets/notes/TBD'
          },
          {
            title: 'Planimetria',
            desc: 'TBD',
            file: '../assets/notes/TBD'
          },
          {
            title: 'Równania',
            desc: 'TBD',
            file: '../assets/notes/TBD'
          }
        ]
      },
      {
        group: '1. Liczby rzeczywiste',
        items: [
          {
            title: 'Liczby naturalne',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Liczby całkowite, liczby wymierne',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Liczby niewymierne',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Rozwinięcie dziesiętne liczby rzeczywistej',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Potęgi',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Pierwiastki',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Logarytmy',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Procenty',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Wartość bezwzględna',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Warto wiedzieć',
            desc: 'Cechy podzielności, długość okręgu, liczba pi, skala logarytmiczna.',
            file: '../assets/notes/'
          }
        ]
      },
      {
        group: '2. Język matematyki',
        items: [
          {
            title: 'Zbiory',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Działania na zbiorach',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Przedziały',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Działania na przedziałach',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Wyrażenia algebraiczne',
            desc: 'TBD - jednomiany, wielomiany, wyłączanie przed nawias wielomianów itd.',
            file: '../assets/notes/'
          },
          {
            title: 'Wzory skróconego mnożenia',
            desc: 'TBD',
            file: '../assets/notes/'
          },
          {
            title: 'Przekształcenia algebraiczne',
            desc: 'TBD',
            file: '../assets/notes/'
          }
          
        ]
      },
      {
        group: '3. Równania',
        items: [
        ]
      },
      {
        group: '4. Nierówności',
        items: [
        ]
      },
      {
        group: '5. Funkcje',
        items: [
        ]
      },
      {
        group: '6. Planimetria',
        items: [
        ]
      },
      {
        group: '7. Trygonometria',
        items: [
        ]
      },
      {
        group: '8. Geometria analityczna',
        items: [
        ]
      },
      {
        group: '9. Stereometria',
        items: [
        ]
      },
      {
        group: '10. Ciągi',
        items: [
        ]
      },
      {
        group: '11. Rachunek różniczkowy',
        items: [
        ]
      },
      {
        group: '12. Statystyka',
        items: [
        ]
      },
      {
        group: '13. Kombinatoryka',
        items: [
        ]
      },
      {
        group: '14. Prawdopodobieństwo',
        items: [
        ]
      },
      {
        group: '15. Dowody',
        items: [
        ]
      }
    ];

    const els = {
      sidebar: document.getElementById('notesSidebar'),
      viewer: document.getElementById('pdfViewer'),
      viewerTitle: document.getElementById('viewerTitle'),
      openNewTabBtn: document.getElementById('openNewTabBtn'),
      downloadBtn: document.getElementById('downloadBtn'),
      notesEmpty: document.getElementById('notesEmpty')
    };

    function setPdf(note, buttonEl) {
      els.viewer.src = `${note.file}#toolbar=1&navpanes=0&view=FitH`;
      els.viewerTitle.textContent = note.title;
      els.openNewTabBtn.href = note.file;
      els.downloadBtn.href = note.file;
      els.notesEmpty.style.display = 'none';

      document.querySelectorAll('.note-btn').forEach(btn => btn.classList.remove('active'));
      if (buttonEl) buttonEl.classList.add('active');
    }

    function renderNotes() {
      els.sidebar.innerHTML = '';

      NOTES_DATA.forEach((group, groupIndex) => {
        const details = document.createElement('details');
        details.className = 'notes-group';
        if (groupIndex === 0) details.open = true;

        const summary = document.createElement('summary');
        summary.textContent = group.group;

        const items = document.createElement('div');
        items.className = 'notes-items';

        group.items.forEach((note, noteIndex) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'note-btn';
          btn.innerHTML = `
            <span class="title">${note.title}</span>
            <span class="desc">${note.desc}</span>
          `;

          btn.addEventListener('click', () => setPdf(note, btn));

          items.appendChild(btn);

          if (groupIndex === 0 && noteIndex === 0) {
            setTimeout(() => setPdf(note, btn), 0);
          }
        });

        details.appendChild(summary);
        details.appendChild(items);
        els.sidebar.appendChild(details);
      });
    }

    renderNotes();