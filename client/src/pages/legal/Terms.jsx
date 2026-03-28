import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import './Terms.css'

const SECTIONS = [
  {
    title: '1. Postanowienia ogolne',
    items: [
      '1.1 Niniejszy Regulamin okresla zasady korzystania z platformy ServeIQ dostepnej pod adresem serveiq.pl (dalej: "Serwis").',
      '1.2 Wlascicielem i operatorem Serwisu jest ServeIQ sp. z o.o. z siedziba w Warszawie (dalej: "Operator").',
      '1.3 Korzystanie z Serwisu oznacza akceptacje niniejszego Regulaminu.',
      '1.4 Serwis przeznaczony jest dla rodzicow i opiekunow prawnych mlodych tenisistow w celu monitorowania zdrowia i rozwoju sportowego dzieci.',
      '1.5 Operator zastrzega sobie prawo do wprowadzania zmian w funkcjonalnosci Serwisu bez wczesniejszego powiadomienia.',
    ],
  },
  {
    title: '2. Konto uzytkownika',
    items: [
      '2.1 Rejestracja konta wymaga podania adresu email, imienia i nazwiska oraz utworzenia hasla.',
      '2.2 Uzytkownik zobowiazuje sie do podania prawdziwych danych osobowych.',
      '2.3 Uzytkownik jest odpowiedzialny za bezpieczenstwo swojego hasla i konta.',
      '2.4 Jedno konto moze byc przypisane do jednego uzytkownika. Udostepnianie konta osobom trzecim jest zabronione.',
      '2.5 Operator ma prawo zawiesic lub usunac konto w przypadku naruszenia Regulaminu.',
      '2.6 Uzytkownik moze w dowolnym momencie usunac swoje konto w ustawieniach profilu.',
    ],
  },
  {
    title: '3. Subskrypcja i platnosci',
    items: [
      '3.1 Serwis oferuje plan darmowy (Free) oraz plany platne (Premium, Family).',
      '3.2 Plan Premium kosztuje 39 zl miesiecznie, plan Family 59 zl miesiecznie.',
      '3.3 Nowi uzytkownicy otrzymuja 14-dniowy darmowy okres probny planu Premium.',
      '3.4 Platnosci sa przetwarzane za posrednictwem Stripe i obowiazuja z gory za kazdy okres rozliczeniowy.',
      '3.5 Subskrypcje mozna anulowac w dowolnym momencie. Anulowanie wchodzi w zycie na koniec biezacego okresu rozliczeniowego.',
      '3.6 Operator nie zwraca platnosci za czesciowo wykorzystane okresy rozliczeniowe.',
      '3.7 Operator zastrzega sobie prawo do zmiany cen z 30-dniowym wyprzedzeniem.',
    ],
  },
  {
    title: '4. Dane zdrowotne',
    items: [
      '4.1 Serwis umozliwia zbieranie danych zdrowotnych z urzadzen wearable (WHOOP, Garmin i innych) polaczonych z kontem uzytkownika.',
      '4.2 Dane zdrowotne obejmuja m.in.: tetno, zmiennosc tetna (HRV), jakosc snu, wynik regeneracji, obciazenie treningowe.',
      '4.3 Dane zdrowotne dzieci sa szczegolnie chronione zgodnie z art. 8 RODO.',
      '4.4 Serwis nie stanowi urzadzenia medycznego i nie zastepuje porady medycznej. Dane maja charakter informacyjny.',
      '4.5 Uzytkownik przyjmuje do wiadomosci, ze dane z urzadzen wearable moga nie byc w pelni dokladne.',
    ],
  },
  {
    title: '5. Ochrona danych osobowych',
    items: [
      '5.1 Przetwarzanie danych osobowych odbywa sie zgodnie z Polityka Prywatnosci oraz przepisami RODO.',
      '5.2 Administratorem danych osobowych jest Operator.',
      '5.3 Dane osobowe sa przetwarzane w celu swiadczenia uslug Serwisu, komunikacji z uzytkownikiem oraz w celach analitycznych.',
      '5.4 Uzytkownik ma prawo dostepu do swoich danych, ich poprawiania, usuwania oraz przenoszenia.',
      '5.5 Szczegolowe informacje dotyczace przetwarzania danych osobowych znajduja sie w Polityce Prywatnosci.',
    ],
  },
  {
    title: '6. Odpowiedzialnosc',
    items: [
      '6.1 Operator doklada starannosci w celu zapewnienia prawidlowego dzialania Serwisu, jednak nie gwarantuje nieprzerwanego dostepu.',
      '6.2 Operator nie ponosi odpowiedzialnosci za szkody wynikle z nieprawidlowego korzystania z Serwisu.',
      '6.3 Operator nie ponosi odpowiedzialnosci za dokladnosc danych pochodzacych z urzadzen wearable.',
      '6.4 Serwis nie stanowi porady medycznej. W sprawach zdrowotnych nalezy skonsultowac sie z lekarzem.',
      '6.5 Uzytkownik ponosi odpowiedzialnosc za decyzje treningowe podejmowane na podstawie danych z Serwisu.',
    ],
  },
  {
    title: '7. Zmiany regulaminu',
    items: [
      '7.1 Operator zastrzega sobie prawo do zmiany niniejszego Regulaminu.',
      '7.2 O zmianach uzytkownicy beda informowani droga mailowa z co najmniej 14-dniowym wyprzedzeniem.',
      '7.3 Dalsze korzystanie z Serwisu po wejsciu zmian w zycie oznacza ich akceptacje.',
      '7.4 W przypadku braku akceptacji zmian uzytkownik ma prawo usunac konto.',
    ],
  },
  {
    title: '8. Kontakt',
    items: [],
    contact: true,
  },
]

export default function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-header">
          <Link to="/" className="terms-back">
            <ArrowLeft size={16} />
            Powrot do strony glownej
          </Link>
          <div className="terms-logo">SERVE<span>IQ</span></div>
          <h1 className="terms-title">Regulamin serwisu</h1>
          <p className="terms-updated">Ostatnia aktualizacja: 28 marca 2026</p>
        </div>

        {SECTIONS.map((section, i) => (
          <div className="terms-section" key={i}>
            <h2 className="terms-section-title">{section.title}</h2>
            {section.items.map((item, j) => (
              <p className="terms-item" key={j}>
                <span className="terms-item-number">{item.split(' ')[0]}</span>
                {item.split(' ').slice(1).join(' ')}
              </p>
            ))}
            {section.contact && (
              <div className="terms-contact">
                <p>
                  W sprawach zwiazanych z Regulaminem prosimy o kontakt:<br />
                  Email: <a href="mailto:kontakt@serveiq.pl">kontakt@serveiq.pl</a><br />
                  ServeIQ sp. z o.o.<br />
                  ul. Sportowa 15<br />
                  00-001 Warszawa, Polska
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
