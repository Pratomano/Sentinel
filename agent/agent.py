import time
import psutil
import requests
import socket
import platform
import os
import sys
import json
import base64
import struct
import tempfile
import threading
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox
from tkinter.scrolledtext import ScrolledText

# ==============================================================================
# LÓGICA DE CONFIGURAÇÃO E PERSISTÊNCIA
# ==============================================================================

def get_config_path():
    """Retorna o caminho absoluto do config.json (compatível com .py e .exe compilado)."""
    if getattr(sys, 'frozen', False):
        base_dir = os.path.dirname(sys.executable)
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "config.json")

def load_config():
    """Carrega as configurações salvas ou gera os valores padrão."""
    default_config = {
        "api_url": "https://sentinel-api-9vud.onrender.com/agent/metrics",
        "token": "",
        "interval_seconds": 5,
        "collect_cpu": True,
        "collect_ram": True,
        "collect_disks": True
    }
    path = get_config_path()
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return {**default_config, **json.load(f)}
        except Exception:
            return default_config
    return default_config

def save_config(config_data):
    """Grava as configurações no arquivo config.json."""
    path = get_config_path()
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(config_data, f, indent=4)

# ==============================================================================
# COLETORES ESPECIALIZADOS DE HARDWARE
# ==============================================================================

def get_machine_info():
    """Coleta informações de identificação exclusiva desta máquina."""
    return {
        "machineId": platform.node() + "-" + platform.system(),
        "hostname": socket.gethostname()
    }

def get_cpu_metrics():
    """Coleta o percentual de uso da CPU."""
    return {
        "cpu_percent": psutil.cpu_percent(interval=1.0)
    }

def get_memory_metrics():
    """Coleta os dados de consumo e total de memória RAM."""
    memory = psutil.virtual_memory()
    return {
        "memory_total_bytes": memory.total,
        "memory_used_bytes": memory.used,
        "memory_percent": memory.percent
    }

def get_disk_metrics():
    """Percorre e coleta todos os volumes de disco montados no computador."""
    disks = []
    for part in psutil.disk_partitions():
        try:
            usage = psutil.disk_usage(part.mountpoint)
            disks.append({
                "device": part.device,
                "total_bytes": usage.total,
                "used_bytes": usage.used,
                "percent": usage.percent
            })
        except (PermissionError, OSError):
            continue
    return {"disks": disks}

def deliver_metrics(flags):
    """
    Função pura que orquestra a coleta apenas dos componentes habilitados nas flags.
    """
    metrics = {
        "cpu_percent": 0.0,
        "memory_total_bytes": 0,
        "memory_used_bytes": 0,
        "memory_percent": 0.0,
        "disks": []
    }
    
    if flags.get('collect_cpu', True):
        metrics.update(get_cpu_metrics())
    if flags.get('collect_ram', True):
        metrics.update(get_memory_metrics())
    if flags.get('collect_disks', True):
        metrics.update(get_disk_metrics())
        
    return metrics

# ==============================================================================
# LOGO OFICIAL SENTINEL (FORMATO CAPACETE MARVEL SENTINEL EM BASE64)
# ==============================================================================
SENTINEL_LOGO_BASE64 = "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"

# ==============================================================================
# INTERFACE GRÁFICA SENTINEL AGENT (TKINTER)
# ==============================================================================

class SentinelAgentApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Sentinel Agent — Monitoramento Windows")
        self.root.geometry("540x660")
        self.root.resizable(False, False)

        # Configura AppUserModelID no Windows (para agrupar com ícone próprio na barra de tarefas)
        try:
            import ctypes
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("sentinel.telemetry.agent.1.0")
        except Exception:
            pass

        # Carrega o logo oficial em memória via Base64
        try:
            self.logo_img = tk.PhotoImage(data=SENTINEL_LOGO_BASE64)
            self.root.iconphoto(True, self.logo_img)
        except Exception:
            self.logo_img = None

        # Carrega e fixa o ícone nativo na barra de título do Windows (onde ficam minimizar/fechar)
        self._apply_window_icon()

        # Paleta Sentinel Dark
        self.COLOR_BG = "#0f0b18"
        self.COLOR_CARD = "#171024"
        self.COLOR_ACCENT = "#9333ea"
        self.COLOR_TEXT = "#f3e8ff"
        self.COLOR_MUTED = "#a855f7"
        self.COLOR_INPUT_BG = "#090510"
        self.COLOR_EMERALD = "#10b981"
        self.COLOR_AMBER = "#f59e0b"
        self.COLOR_ROSE = "#ef4444"

        self.root.configure(bg=self.COLOR_BG)

        # Carrega configuração em memória
        self.config = load_config()
        self.machine_info = get_machine_info()

        # Flags de controle de execução
        self.is_running = True
        self.is_alive = True

        self._build_ui()
        self._center_window()

        # Inicia a thread de transmissão em segundo plano
        self.worker_thread = threading.Thread(target=self._telemetry_worker, daemon=True)
        self.worker_thread.start()

        # Protocolo de fechamento limpo
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _center_window(self):
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f"{width}x{height}+{x}+{y}")

    def _apply_window_icon(self):
        """Aplica o ícone oficial na barra de título do Windows (onde ficam minimizar/fechar)."""
        try:
            # 1. Tenta carregar sentinel.ico de locais conhecidos (disco ou bundle PyInstaller)
            bundle_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            candidates = [
                os.path.join(bundle_dir, "sentinel.ico"),
                os.path.join(os.path.dirname(get_config_path()), "sentinel.ico"),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), "sentinel.ico"),
                "sentinel.ico"
            ]
            for path in candidates:
                if os.path.exists(path):
                    self.root.iconbitmap(path)
                    return

            # 2. Se não encontrar o arquivo no disco, gera um .ico temporário no %TEMP% a partir do Base64
            png_bytes = base64.b64decode(SENTINEL_LOGO_BASE64)
            # Cabeçalho ICO de 22 bytes embutindo o PNG diretamente
            ico_header = struct.pack('<HHHBBBBHHII', 0, 1, 1, 48, 48, 0, 0, 1, 32, len(png_bytes), 22)
            temp_ico = os.path.join(tempfile.gettempdir(), "sentinel_titlebar.ico")
            with open(temp_ico, "wb") as f:
                f.write(ico_header + png_bytes)
            self.root.iconbitmap(temp_ico)
        except Exception:
            pass

    def _build_ui(self):
        # Container Principal com padding
        main_frame = tk.Frame(self.root, bg=self.COLOR_BG, padx=20, pady=16)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 1. CABEÇALHO / HERO
        header_frame = tk.Frame(main_frame, bg=self.COLOR_BG)
        header_frame.pack(fill=tk.X, pady=(0, 16))

        if self.logo_img:
            logo_label = tk.Label(header_frame, image=self.logo_img, bg=self.COLOR_BG)
            logo_label.pack(side=tk.LEFT, padx=(0, 14))

        titles_container = tk.Frame(header_frame, bg=self.COLOR_BG)
        titles_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        title_label = tk.Label(
            titles_container,
            text="SENTINEL AGENT",
            font=("Segoe UI", 16, "bold"),
            fg="#ffffff",
            bg=self.COLOR_BG
        )
        title_label.pack(anchor="w")

        subtitle_label = tk.Label(
            titles_container,
            text=f"Máquina: {self.machine_info['hostname']} ({self.machine_info['machineId']})",
            font=("Segoe UI", 9),
            fg=self.COLOR_MUTED,
            bg=self.COLOR_BG
        )
        subtitle_label.pack(anchor="w")

        # 2. CARD DE CONFIGURAÇÃO (Token e Intervalo)
        config_card = tk.LabelFrame(
            main_frame,
            text=" Configurações de Conexão ",
            font=("Segoe UI", 10, "bold"),
            fg=self.COLOR_TEXT,
            bg=self.COLOR_CARD,
            bd=1,
            relief="solid",
            padx=14,
            pady=12
        )
        config_card.pack(fill=tk.X, pady=(0, 12))

        # Campo Token
        tk.Label(
            config_card,
            text="Chave de Acesso (Token do Usuário):",
            font=("Segoe UI", 9),
            fg=self.COLOR_TEXT,
            bg=self.COLOR_CARD
        ).pack(anchor="w")

        self.token_entry = tk.Entry(
            config_card,
            font=("Consolas", 10),
            bg=self.COLOR_INPUT_BG,
            fg="#ffffff",
            insertbackground="#ffffff",
            bd=1,
            relief="solid"
        )
        self.token_entry.pack(fill=tk.X, pady=(4, 10), ipady=4)
        self.token_entry.insert(0, self.config.get("token", ""))

        # Campo Intervalo
        interval_row = tk.Frame(config_card, bg=self.COLOR_CARD)
        interval_row.pack(fill=tk.X)

        tk.Label(
            interval_row,
            text="Intervalo de Envio (segundos):",
            font=("Segoe UI", 9),
            fg=self.COLOR_TEXT,
            bg=self.COLOR_CARD
        ).pack(side=tk.LEFT)

        self.interval_spinbox = tk.Spinbox(
            interval_row,
            from_=1,
            to=300,
            width=6,
            font=("Segoe UI", 9, "bold"),
            bg=self.COLOR_INPUT_BG,
            fg="#ffffff",
            insertbackground="#ffffff",
            bd=1,
            relief="solid"
        )
        self.interval_spinbox.pack(side=tk.RIGHT)
        self.interval_spinbox.delete(0, "end")
        self.interval_spinbox.insert(0, str(self.config.get("interval_seconds", 5)))

        # 3. CARD DE PRIVACIDADE / O QUE COLETAR
        filter_card = tk.LabelFrame(
            main_frame,
            text=" Métricas Coletadas (Privacidade) ",
            font=("Segoe UI", 10, "bold"),
            fg=self.COLOR_TEXT,
            bg=self.COLOR_CARD,
            bd=1,
            relief="solid",
            padx=14,
            pady=10
        )
        filter_card.pack(fill=tk.X, pady=(0, 12))

        checkbox_row = tk.Frame(filter_card, bg=self.COLOR_CARD)
        checkbox_row.pack(fill=tk.X)

        self.var_cpu = tk.BooleanVar(value=self.config.get("collect_cpu", True))
        self.var_ram = tk.BooleanVar(value=self.config.get("collect_ram", True))
        self.var_disks = tk.BooleanVar(value=self.config.get("collect_disks", True))

        tk.Checkbutton(
            checkbox_row,
            text="⚡ Processador (CPU)",
            variable=self.var_cpu,
            font=("Segoe UI", 9),
            bg=self.COLOR_CARD,
            fg=self.COLOR_TEXT,
            selectcolor=self.COLOR_INPUT_BG,
            activebackground=self.COLOR_CARD,
            activeforeground=self.COLOR_TEXT
        ).pack(side=tk.LEFT, expand=True)

        tk.Checkbutton(
            checkbox_row,
            text="🧠 Memória RAM",
            variable=self.var_ram,
            font=("Segoe UI", 9),
            bg=self.COLOR_CARD,
            fg=self.COLOR_TEXT,
            selectcolor=self.COLOR_INPUT_BG,
            activebackground=self.COLOR_CARD,
            activeforeground=self.COLOR_TEXT
        ).pack(side=tk.LEFT, expand=True)

        tk.Checkbutton(
            checkbox_row,
            text="💾 Discos",
            variable=self.var_disks,
            font=("Segoe UI", 9),
            bg=self.COLOR_CARD,
            fg=self.COLOR_TEXT,
            selectcolor=self.COLOR_INPUT_BG,
            activebackground=self.COLOR_CARD,
            activeforeground=self.COLOR_TEXT
        ).pack(side=tk.LEFT, expand=True)

        # 4. BARRA DE AÇÕES (Botão Iniciar/Pausar + Salvar)
        action_row = tk.Frame(main_frame, bg=self.COLOR_BG)
        action_row.pack(fill=tk.X, pady=(0, 12))

        self.toggle_btn = tk.Button(
            action_row,
            text="⏸️ Pausar Monitoramento",
            font=("Segoe UI", 10, "bold"),
            bg=self.COLOR_AMBER,
            fg="#000000",
            activebackground="#d97706",
            bd=0,
            padx=16,
            pady=8,
            cursor="hand2",
            command=self._toggle_running
        )
        self.toggle_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 6))

        save_btn = tk.Button(
            action_row,
            text="💾 Salvar Preferências",
            font=("Segoe UI", 10, "bold"),
            bg="#4c1d95",
            fg="#ffffff",
            activebackground="#581c87",
            bd=0,
            padx=16,
            pady=8,
            cursor="hand2",
            command=self._save_preferences
        )
        save_btn.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(6, 0))

        # Indicador de Status
        self.status_label = tk.Label(
            main_frame,
            text="● STATUS: TRANSMITINDO DADOS EM TEMPO REAL",
            font=("Segoe UI", 9, "bold"),
            fg=self.COLOR_EMERALD,
            bg=self.COLOR_BG
        )
        self.status_label.pack(anchor="w", pady=(0, 8))

        # 5. CONSOLE DE ATIVIDADES (LOGS AO VIVO)
        tk.Label(
            main_frame,
            text="Console de Telemetria e Transmissão:",
            font=("Segoe UI", 9),
            fg=self.COLOR_MUTED,
            bg=self.COLOR_BG
        ).pack(anchor="w")

        self.log_text = ScrolledText(
            main_frame,
            font=("Consolas", 9),
            bg=self.COLOR_INPUT_BG,
            fg="#c084fc",
            insertbackground="#ffffff",
            bd=1,
            relief="solid",
            height=9
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, pady=(4, 0))

        # Log inicial
        self._log(f"Agente iniciado com sucesso. Conectado ao servidor.")
        self._log(f"ID da Máquina: {self.machine_info['machineId']}")

    def _log(self, message):
        """Adiciona uma mensagem formatada ao console de log."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)

    def _toggle_running(self):
        """Alterna entre Pausar e Retomar a transmissão."""
        self.is_running = not self.is_running
        if self.is_running:
            self.toggle_btn.config(
                text="⏸️ Pausar Monitoramento",
                bg=self.COLOR_AMBER,
                fg="#000000"
            )
            self.status_label.config(
                text="● STATUS: TRANSMITINDO DADOS EM TEMPO REAL",
                fg=self.COLOR_EMERALD
            )
            self._log("▶️ Transmissão de telemetria retomada pelo usuário.")
        else:
            self.toggle_btn.config(
                text="▶️ Iniciar Monitoramento",
                bg=self.COLOR_EMERALD,
                fg="#ffffff"
            )
            self.status_label.config(
                text="○ STATUS: TRANSMISSÃO PAUSADA",
                fg=self.COLOR_AMBER
            )
            self._log("⏸️ Transmissão de telemetria pausada pelo usuário.")

    def _save_preferences(self):
        """Salva as configurações atuais dos inputs para o config.json."""
        try:
            interval = int(self.interval_spinbox.get().strip())
            if interval < 1:
                interval = 1
        except ValueError:
            interval = 5

        new_config = {
            "api_url": self.config.get("api_url", "http://localhost:3000/agent/metrics"),
            "token": self.token_entry.get().strip(),
            "interval_seconds": interval,
            "collect_cpu": self.var_cpu.get(),
            "collect_ram": self.var_ram.get(),
            "collect_disks": self.var_disks.get()
        }

        save_config(new_config)
        self.config = new_config
        self._log(f"💾 Configurações salvas no config.json (Intervalo: {interval}s).")
        messagebox.showinfo("Sentinel", "Configurações salvas com sucesso!")

    def _telemetry_worker(self):
        """Thread trabalhadora que coleta e despacha as métricas para a API."""
        while self.is_alive:
            if self.is_running:
                token = self.token_entry.get().strip()
                api_url = self.config.get("api_url", "http://localhost:3000/agent/metrics")

                if not token:
                    self.root.after(0, self._log, "⚠️ Atenção: Token de acesso vazio. Transmissão aguardando chave.")
                else:
                    flags = {
                        "collect_cpu": self.var_cpu.get(),
                        "collect_ram": self.var_ram.get(),
                        "collect_disks": self.var_disks.get()
                    }

                    try:
                        metrics = deliver_metrics(flags)
                        payload = {**self.machine_info, **metrics}
                        headers = {"x-agent-token": token}

                        response = requests.post(api_url, headers=headers, json=payload, timeout=5)

                        if response.status_code == 200:
                            cpu_info = f"CPU: {payload['cpu_percent']}%" if flags['collect_cpu'] else "CPU: Desativado"
                            ram_info = f"RAM: {payload['memory_percent']}%" if flags['collect_ram'] else "RAM: Desativado"
                            self.root.after(0, self._log, f"✅ Enviado (Status: 200) | {cpu_info} | {ram_info}")
                        else:
                            self.root.after(0, self._log, f"❌ Rejeitado pela Base (Status: {response.status_code})")
                    except requests.exceptions.RequestException as e:
                        self.root.after(0, self._log, f"Falha de conexão: Servidor indisponível.")

            # Intervalo inteligente: dorme em pedaços pequenos de 200ms
            # para que o botão de "Pausar" responda instantaneamente!
            try:
                interval = int(self.interval_spinbox.get().strip())
            except ValueError:
                interval = 5

            sleep_cycles = max(1, int(interval / 0.2))
            for _ in range(sleep_cycles):
                if not self.is_alive:
                    break
                time.sleep(0.2)

    def _on_close(self):
        """Encerramento gracioso do robô."""
        self.is_alive = False
        self.root.destroy()

# ==============================================================================
# PONTO DE ENTRADA
# ==============================================================================

if __name__ == "__main__":
    root = tk.Tk()
    app = SentinelAgentApp(root)
    root.mainloop()
