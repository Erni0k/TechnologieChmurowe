# Technologie Chmurowe – Projekt Zaliczeniowy

Przykładowy projekt spełniający wszystkie wymagania zaliczeniowe na ocenę **bdb**.
Aplikacja to menedżer zadań (CRUD) wdrożony na Azure z pełnym potokiem CI/CD.

## Architektura

```
Internet
    |
    v
[Azure VM – Ubuntu 22.04, Standard_B1s]
    |
    v
[Nginx – porty 80/443, terminacja HTTPS]
    |
    +---> /api/*  --> [backend  – Node.js/Express – port 3000]
    |                      |
    |              [postgres  – PostgreSQL 15    – port 5432]
    |
    +---> /*      --> [frontend – React + nginx  – port 80]
```

**Stos technologiczny:**
- Backend: Node.js + Express + pg + bcryptjs + JWT
- Frontend: React + axios
- Baza danych: PostgreSQL 15
- Infrastruktura: Azure VM (Terraform)
- Konteneryzacja: Docker + Docker Compose
- CI/CD: GitHub Actions

## Spełnione wymagania projektowe

| Ocena | Wymaganie | Realizacja |
|-------|-----------|------------|
| dst   | Aplikacja CRUD + CI/CD | Express API (Create/Read/Update/Delete zadań) + GitHub Actions |
| dst+  | HTTPS + hashowanie haseł | Nginx SSL (port 443) + bcrypt (12 rund) |
| db    | Wdrożenie na VM (Terraform) | `terraform apply` tworzy VM z Dockerem |
| db+   | Mikrousługi + Docker Compose | 4 kontenery: postgres, backend, frontend, nginx |
| bdb   | Testy jednostkowe w CI/CD | Jest + supertest, uruchamiane w każdym pipeline |

---

## Wymagania wstępne

Zainstaluj przed rozpoczęciem:

| Narzędzie | Wersja | Instalacja |
|-----------|--------|------------|
| Node.js | 20+ | https://nodejs.org |
| Docker Desktop | najnowsza | https://docker.com/products/docker-desktop |
| Terraform | ≥ 1.5 | https://developer.hashicorp.com/terraform/install |
| Azure CLI | najnowsza | https://learn.microsoft.com/cli/azure/install-azure-cli |
| Git | dowolna | https://git-scm.com |

Potrzebne konta:
- **Azure** z aktywną subskrypcją (np. Azure for Students – $100 kredytów)
- **Docker Hub** (darmowe konto na hub.docker.com)
- **GitHub** z repozytorium (fork lub własne)

---

## 1. Uruchomienie lokalne (development)

```bash
# Sklonuj repozytorium
git clone https://github.com/TWOJ_USERNAME/TWOJE_REPO.git
cd TWOJE_REPO

# Skopiuj plik z przykładowymi zmiennymi środowiskowymi
cp .env.example .env
# (opcjonalnie edytuj .env – domyślne wartości działają lokalnie)

# Uruchom wszystkie usługi
docker compose up --build

# Aplikacja dostępna pod adresem:
# http://localhost:3001  (frontend)
# http://localhost:3000  (backend API)
```

Zarejestruj użytkownika, zaloguj się i zarządzaj zadaniami przez przeglądarkę.

---

## 2. Testy jednostkowe

```bash
cd backend
npm install
npm test
```

Testy używają Jest + supertest z zamockowaną bazą danych – nie wymagają uruchomionego Dockera ani PostgreSQL.

```
PASS tests/tasks.test.js
  GET /api/health
    ✓ returns 200 with status ok
  POST /api/auth/register
    ✓ creates user and returns token
    ✓ returns 400 when username already exists
    ✓ returns 400 when password is too short
    ✓ stores a bcrypt hash, not plaintext password
  POST /api/auth/login
    ✓ returns token for valid credentials
    ✓ returns 401 for wrong password
    ✓ returns 401 for unknown user
  GET /api/tasks
    ✓ returns 401 without token
    ✓ returns task list for authenticated user
  POST /api/tasks
    ✓ creates a new task
    ✓ returns 400 when title is missing
  DELETE /api/tasks/:id
    ✓ deletes task and returns 204
    ✓ returns 404 when task does not exist
```

---

## 3. Infrastruktura Azure – Terraform

### 3.1. Zaloguj się do Azure

```bash
az login
az account show   # zanotuj "id" – to Twój subscription_id
```

### 3.2. Wygeneruj klucz SSH

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/tc_key -N ""
# Tworzy: ~/.ssh/tc_key (prywatny) i ~/.ssh/tc_key.pub (publiczny)
```

### 3.3. Zainicjalizuj Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 3.4. Zaplanuj infrastrukturę (podgląd zmian)

```bash
terraform plan \
  -var="subscription_id=TWOJE_SUBSCRIPTION_ID" \
  -var="ssh_public_key=$(cat ~/.ssh/tc_key.pub)"
```

### 3.5. Utwórz infrastrukturę

```bash
terraform apply \
  -var="subscription_id=TWOJE_SUBSCRIPTION_ID" \
  -var="ssh_public_key=$(cat ~/.ssh/tc_key.pub)"
```

Po zakończeniu (~3 minuty) Terraform wypisze:

```
Outputs:
public_ip_address = "20.123.45.67"
ssh_command       = "ssh azureuser@20.123.45.67"
app_url           = "https://20.123.45.67"
```

**Zanotuj adres IP** – będzie potrzebny w sekcji 4.

### 3.6. Zweryfikuj VM

```bash
ssh -i ~/.ssh/tc_key azureuser@TWOJ_IP
docker --version      # powinno wyświetlić Docker version 24.x
docker compose version
exit
```

### 3.7. Usuwanie infrastruktury (po zakończeniu projektu)

```bash
terraform destroy \
  -var="subscription_id=TWOJE_SUBSCRIPTION_ID" \
  -var="ssh_public_key=$(cat ~/.ssh/tc_key.pub)"
```

---

## 4. Konfiguracja CI/CD – GitHub Secrets

Przejdź do repozytorium na GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Dodaj następujące sekrety:

| Nazwa sekretu | Wartość | Opis |
|---------------|---------|------|
| `DOCKERHUB_USERNAME` | `twoja_nazwa` | Nazwa użytkownika Docker Hub |
| `DOCKERHUB_TOKEN` | `dckr_pat_xxx` | Token Docker Hub (nie hasło!) |
| `VM_HOST` | `20.123.45.67` | Publiczny IP VM z outputu Terraform |
| `VM_USER` | `azureuser` | Domyślna nazwa użytkownika SSH |
| `VM_SSH_PRIVATE_KEY` | zawartość `~/.ssh/tc_key` | Klucz prywatny SSH (cały plik!) |
| `DB_NAME` | `tasksdb` | Nazwa bazy danych |
| `DB_USER` | `postgres` | Użytkownik bazy danych |
| `DB_PASSWORD` | `silne_haslo_123` | Hasło do bazy (zmień!) |
| `JWT_SECRET` | wynik `openssl rand -hex 32` | Sekret do podpisywania tokenów JWT |

**Jak uzyskać token Docker Hub:**
1. Zaloguj się na hub.docker.com
2. Account Settings → Security → Access Tokens
3. Generate New Token → skopiuj wartość

---

## 5. Pierwsze wdrożenie

Po skonfigurowaniu sekretów wystarczy jeden push:

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

GitHub Actions uruchomi pipeline automatycznie:

```
[test-backend]     → testy jednostkowe (~30 sekund)
      |
[build-and-push]   → budowanie obrazów Docker i push na Docker Hub (~3 minuty)
      |
[deploy]           → wdrożenie na Azure VM (~1 minuta)
```

### Weryfikacja wdrożenia

```bash
# Sprawdź czy pipeline przeszedł (zielony znacznik na GitHub)
# Otwórz w przeglądarce:
https://TWOJ_IP

# Sprawdź przekierowanie HTTP→HTTPS
curl -I http://TWOJ_IP
# Odpowiedź: HTTP/1.1 301 Moved Permanently

# Sprawdź API
curl -k https://TWOJ_IP/api/health
# Odpowiedź: {"status":"ok"}
```

> **Uwaga:** Przeglądarka pokaże ostrzeżenie o certyfikacie (self-signed). Kliknij "Zaawansowane" → "Przejdź mimo to". Jest to normalne przy certyfikatach self-signed – w produkcji używa się Let's Encrypt.

---

## 6. Architektura bezpieczeństwa

### HTTPS (dst+)
- Nginx nasłuchuje na porcie 80 i przekierowuje (301) wszystkie żądania na port 443
- Certyfikat SSL generowany przez OpenSSL w pipeline CI/CD
- Protokoły: TLSv1.2 i TLSv1.3 (starsze wyłączone)

### Hashowanie haseł (dst+)
- Biblioteka `bcryptjs` z 12 rundami hashowania
- Hasło nigdy nie jest przechowywane w bazie – tylko hash
- Weryfikacja przez `bcrypt.compare()` przy logowaniu

### Tokeny JWT
- Podpisane sekretnym kluczem (`JWT_SECRET`) przechowywany jako GitHub Secret
- Czas wygaśnięcia: 7 dni
- Przesyłane w nagłówku `Authorization: Bearer <token>`

### Zmienne środowiskowe
- Sekrety przechowywane w GitHub Secrets, nie w kodzie
- Na VM zapisywane do pliku `.env` (w `.gitignore`)
- Nigdy nie commituj `.env` do repozytorium!

---

## 7. Opis mikrousług i Docker Compose (db+)

Aplikacja działa jako 4 niezależne kontenery komunikujące się przez wewnętrzną sieć Docker:

```
┌─────────────────────────────────────────────────────┐
│  Docker network (bridge)                            │
│                                                     │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐        │
│  │ nginx   │───▶│frontend │    │ backend  │         │
│  │ :80/443 │    │   :80   │    │  :3000   │         │
│  └─────────┘    └─────────┘    └────┬─────┘        │
│       │                             │               │
│       └──────────────────────▶ /api │               │
│                                     │               │
│                              ┌──────▼──────┐        │
│                              │  postgres   │        │
│                              │   :5432     │        │
│                              └─────────────┘        │
└─────────────────────────────────────────────────────┘
```

Kontenery komunikują się po nazwie usługi (np. `backend:3000`, `postgres:5432`). Tylko nginx eksponuje porty na zewnątrz (80 i 443).

### Komendy zarządzania (na VM)

```bash
cd /opt/app

# Status kontenerów
docker compose -f docker-compose.prod.yml ps

# Logi
docker compose -f docker-compose.prod.yml logs -f backend

# Restart usługi
docker compose -f docker-compose.prod.yml restart backend

# Zatrzymanie
docker compose -f docker-compose.prod.yml down
```

---

## 8. Uwagi dla środowiska produkcyjnego

**Certyfikat SSL (Let's Encrypt):**
```bash
# Kup domenę (np. na Azure DNS lub Namecheap)
# Zainstaluj certbot na VM:
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d twoja-domena.pl
```

**Baza danych w chmurze:**
Zamiast kontenera PostgreSQL użyj Azure Database for PostgreSQL – ma automatyczne backupy i wysoką dostępność.

**Rotacja sekretów:**
Regularnie odnawiaj `JWT_SECRET` i hasła. Po zmianie przeprowadź nowe wdrożenie przez pipeline.

---

## Struktura plików projektu

```
.
├── backend/
│   ├── src/
│   │   ├── app.js              # Główna aplikacja Express
│   │   ├── middleware/auth.js  # Weryfikacja JWT
│   │   ├── models/db.js        # Połączenie z PostgreSQL
│   │   └── routes/
│   │       ├── auth.js         # POST /api/auth/register, /login
│   │       └── tasks.js        # CRUD /api/tasks
│   ├── tests/tasks.test.js     # Testy jednostkowe (Jest + supertest)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js              # Główny komponent, routing
│   │   ├── api.js              # Axios z interceptorem JWT
│   │   └── components/
│   │       ├── Login.js
│   │       ├── Register.js
│   │       └── TaskList.js     # Lista zadań CRUD
│   ├── nginx.conf              # Konfiguracja nginx (SPA routing)
│   └── Dockerfile
├── nginx/
│   └── nginx.conf              # Reverse proxy + HTTPS
├── infrastructure/
│   └── terraform/
│       ├── main.tf             # Zasoby Azure (VM, VNet, NSG, IP)
│       ├── variables.tf        # Zmienne konfiguracyjne
│       └── outputs.tf          # Wyjścia (IP, SSH command)
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # Pipeline: test → build → deploy
├── docker-compose.yml          # Lokalne środowisko deweloperskie
├── docker-compose.prod.yml     # Produkcja (gotowe obrazy z Docker Hub)
├── .env.example                # Szablon zmiennych środowiskowych
└── README.md                   # Ta instrukcja
```
