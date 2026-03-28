import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './Privacy.css'

export default function Privacy() {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <Link to="/" className="privacy-back">
            <ArrowLeft size={16} />
            Powrot do strony glownej
          </Link>
          <div className="privacy-logo">SERVE<span>IQ</span></div>
          <h1 className="privacy-title">Polityka prywatnosci</h1>
          <p className="privacy-updated">Ostatnia aktualizacja: 28 marca 2026</p>
        </div>

        <div className="privacy-intro">
          Niniejsza Polityka Prywatnosci opisuje zasady przetwarzania danych osobowych
          przez ServeIQ sp. z o.o. zgodnie z Rozporzadzeniem Parlamentu Europejskiego
          i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz polskimi przepisami
          o ochronie danych osobowych.
        </div>

        {/* 1. Administrator danych */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">1. Administrator danych</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">1.1</span>
            Administratorem danych osobowych jest ServeIQ sp. z o.o. z siedziba w Warszawie,
            ul. Sportowa 15, 00-001 Warszawa, wpisana do rejestru przedsiebiorcow KRS
            (dalej: "Administrator").
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">1.2</span>
            Kontakt z Administratorem mozliwy jest pod adresem email: kontakt@serveiq.pl.
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">1.3</span>
            Administrator wyznaczyl Inspektora Ochrony Danych (IOD), z ktorym mozna
            kontaktowac sie pod adresem: iod@serveiq.pl.
          </p>
        </div>

        {/* 2. Zakres zbieranych danych */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">2. Zakres zbieranych danych</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">2.1</span>
            Administrator zbiera nastepujace kategorie danych osobowych:
          </p>
          <ul className="privacy-list">
            <li>Dane identyfikacyjne: imie, nazwisko, adres email</li>
            <li>Dane uwierzytelniajace: haslo (przechowywane w formie zaszyfrowanej)</li>
            <li>Dane dzieci: imie, nazwisko, data urodzenia, plec, dane sportowe</li>
            <li>Dane zdrowotne: tetno, zmiennosc tetna (HRV), jakosc snu, czas snu, wynik regeneracji, obciazenie treningowe</li>
            <li>Dane z urzadzen wearable: identyfikatory urzadzen, dane synchronizacji</li>
            <li>Dane o subskrypcji: plan, status platnosci, historia transakcji</li>
            <li>Dane techniczne: adres IP, typ przegladarki, logi serwera</li>
          </ul>
          <p className="privacy-item">
            <span className="privacy-item-number">2.2</span>
            Podanie danych osobowych jest dobrowolne, lecz niezbedne do korzystania z Serwisu.
          </p>
        </div>

        {/* 3. Cel przetwarzania */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">3. Cel przetwarzania</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">3.1</span>
            Dane osobowe przetwarzane sa w nastepujacych celach:
          </p>
          <ul className="privacy-list">
            <li>Swiadczenie uslug platformy ServeIQ (art. 6 ust. 1 lit. b RODO)</li>
            <li>Monitorowanie zdrowia i rozwoju sportowego dzieci na zlecenie rodzicow (art. 6 ust. 1 lit. a RODO)</li>
            <li>Przetwarzanie platnosci i zarzadzanie subskrypcjami (art. 6 ust. 1 lit. b RODO)</li>
            <li>Wysylanie powiadomien i alertow zdrowotnych (art. 6 ust. 1 lit. a RODO)</li>
            <li>Analiza i ulepszanie Serwisu (art. 6 ust. 1 lit. f RODO)</li>
            <li>Komunikacja z uzytkownikami (art. 6 ust. 1 lit. b RODO)</li>
            <li>Wypelnianie obowiazkow prawnych (art. 6 ust. 1 lit. c RODO)</li>
          </ul>
        </div>

        {/* 4. Podstawa prawna */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">4. Podstawa prawna</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">4.1</span>
            Przetwarzanie danych osobowych odbywa sie na podstawie:
          </p>
          <ul className="privacy-list">
            <li>Zgody uzytkownika (art. 6 ust. 1 lit. a RODO) - w szczegolnosci dla danych zdrowotnych</li>
            <li>Wykonania umowy (art. 6 ust. 1 lit. b RODO) - w zakresie niezbednym do swiadczenia uslug</li>
            <li>Prawnie uzasadnionego interesu Administratora (art. 6 ust. 1 lit. f RODO) - dla analityki i ulepszania Serwisu</li>
            <li>Wyraznej zgody na przetwarzanie danych szczegolnych kategorii (art. 9 ust. 2 lit. a RODO) - dla danych zdrowotnych</li>
          </ul>
        </div>

        {/* 5. Dane zdrowotne dzieci */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">5. Dane zdrowotne dzieci</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">5.1</span>
            Dane zdrowotne dzieci stanowia dane szczegolnych kategorii (art. 9 RODO) i sa
            przetwarzane wylacznie na podstawie wyraznej zgody rodzica lub opiekuna prawnego.
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">5.2</span>
            Zgodnie z art. 8 RODO, przetwarzanie danych dzieci ponizej 16 roku zycia wymaga
            zgody rodzica lub opiekuna prawnego.
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">5.3</span>
            Administrator stosuje szczegolne srodki bezpieczenstwa dla danych zdrowotnych dzieci,
            w tym szyfrowanie, kontrole dostepu i regularne audyty bezpieczenstwa.
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">5.4</span>
            Dane zdrowotne dzieci nie sa udostepniane osobom trzecim bez wyraznej zgody rodzica.
          </p>
        </div>

        {/* 6. Przekazywanie danych */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">6. Przekazywanie danych</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">6.1</span>
            Dane osobowe moga byc przekazywane nastepujacym kategoriom odbiorcow:
          </p>
          <ul className="privacy-list">
            <li>Dostawcy uslug IT i hostingu (serwery, bazy danych)</li>
            <li>Dostawcy uslug platniczych (Stripe Inc.)</li>
            <li>Dostawcy uslug email (wysylka powiadomien)</li>
            <li>Producenci urzadzen wearable (WHOOP, Garmin) - w zakresie niezbednym do synchronizacji danych</li>
          </ul>
          <p className="privacy-item">
            <span className="privacy-item-number">6.2</span>
            W przypadku przekazywania danych poza Europejski Obszar Gospodarczy (EOG), Administrator
            zapewnia odpowiedni poziom ochrony danych zgodnie z rozdzialem V RODO.
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">6.3</span>
            Administrator nie sprzedaje danych osobowych uzytkownikow ani ich dzieci osobom trzecim.
          </p>
        </div>

        {/* 7. Prawa uzytkownika */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">7. Prawa uzytkownika</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">7.1</span>
            Uzytkownicy maja nastepujace prawa zwiazane z przetwarzaniem danych osobowych:
          </p>
          <ul className="privacy-list">
            <li>Prawo dostepu do danych (art. 15 RODO)</li>
            <li>Prawo do sprostowania danych (art. 16 RODO)</li>
            <li>Prawo do usuwania danych - "prawo do bycia zapomnianym" (art. 17 RODO)</li>
            <li>Prawo do ograniczenia przetwarzania (art. 18 RODO)</li>
            <li>Prawo do przenoszenia danych (art. 20 RODO)</li>
            <li>Prawo do sprzeciwu (art. 21 RODO)</li>
            <li>Prawo do cofniecia zgody w dowolnym momencie (art. 7 ust. 3 RODO)</li>
            <li>Prawo do wniesienia skargi do organu nadzorczego - Prezesa UODO</li>
          </ul>
          <p className="privacy-item">
            <span className="privacy-item-number">7.2</span>
            Realizacja praw jest mozliwa poprzez kontakt z Administratorem lub IOD.
          </p>
        </div>

        {/* 8. Bezpieczenstwo */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">8. Bezpieczenstwo</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">8.1</span>
            Administrator stosuje odpowiednie srodki techniczne i organizacyjne w celu ochrony
            danych osobowych, w tym:
          </p>
          <ul className="privacy-list">
            <li>Szyfrowanie danych w transmisji (TLS/SSL) i w spoczynku</li>
            <li>Hashowanie hasel z uzyciem bezpiecznych algorytmow (bcrypt)</li>
            <li>Kontrola dostepu oparta na rolach</li>
            <li>Regularne kopie zapasowe</li>
            <li>Monitoring i logowanie dostepu</li>
            <li>Regularne audyty bezpieczenstwa</li>
          </ul>
        </div>

        {/* 9. Cookies */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">9. Cookies</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">9.1</span>
            Serwis wykorzystuje pliki cookies (ciasteczka) niezbedne do dzialania platformy.
          </p>
          <p className="privacy-item">
            <span className="privacy-item-number">9.2</span>
            Rodzaje wykorzystywanych cookies:
          </p>
          <ul className="privacy-list">
            <li>Cookies sesyjne - niezbedne do utrzymania sesji uzytkownika</li>
            <li>Cookies uwierzytelniajace - przechowywanie tokenow autoryzacji</li>
            <li>Cookies analityczne - anonimowe statystyki uzytkowania (opcjonalnie)</li>
          </ul>
          <p className="privacy-item">
            <span className="privacy-item-number">9.3</span>
            Uzytkownik moze zarzadzac ustawieniami cookies w swojej przegladarce internetowej.
          </p>
        </div>

        {/* 10. Kontakt z IOD */}
        <div className="privacy-section">
          <h2 className="privacy-section-title">10. Kontakt z IOD</h2>
          <p className="privacy-item">
            <span className="privacy-item-number">10.1</span>
            Inspektor Ochrony Danych (IOD) jest dostepny w sprawach zwiazanych z przetwarzaniem
            danych osobowych.
          </p>
          <div className="privacy-contact">
            <p>
              Inspektor Ochrony Danych<br />
              ServeIQ sp. z o.o.<br />
              Email: <a href="mailto:iod@serveiq.pl">iod@serveiq.pl</a><br />
              <br />
              Kontakt ogolny:<br />
              Email: <a href="mailto:kontakt@serveiq.pl">kontakt@serveiq.pl</a><br />
              ul. Sportowa 15<br />
              00-001 Warszawa, Polska
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
