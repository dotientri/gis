"""
GIS Park Management System - Tkinter Desktop App (Lightweight Version)
Using built-in Tkinter for better compatibility

Run with: python gis_desktop_app_lite.py
"""

import sys
import os
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
import csv
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
import django
django.setup()

from parks.models import (
    CongVien, CayXanh, QuanHuyen, PhuongXa,
    LoaiCongVien, TrangThaiCongVien, LoaiTienIch,
    NguoiDung, DanhGiaCongVien
)


class ParkDialog(tk.Toplevel):
    """Dialog for adding/editing parks"""
    
    def __init__(self, parent, park=None):
        super().__init__(parent)
        self.park = park
        self.result = None
        
        self.title("Edit Park" if park else "Add Park")
        self.geometry("600x700")
        self.resizable(False, False)
        
        self.init_ui()
        if park:
            self.load_park_data()
        
        self.transient(parent)
        self.grab_set()
        self.wait_window()
    
    def init_ui(self):
        # Main frame
        main_frame = ttk.Frame(self, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Park name
        ttk.Label(main_frame, text="Park Name *").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.name_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.name_var, width=40).grid(row=0, column=1, pady=5)
        
        # Code
        ttk.Label(main_frame, text="Code").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.code_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.code_var, width=40).grid(row=1, column=1, pady=5)
        
        # Address
        ttk.Label(main_frame, text="Address").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.address_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.address_var, width=40).grid(row=2, column=1, pady=5)
        
        # District
        ttk.Label(main_frame, text="District").grid(row=3, column=0, sticky=tk.W, pady=5)
        districts = [d.ten_quan_huyen for d in QuanHuyen.objects.all()]
        self.district_var = tk.StringVar()
        ttk.Combobox(main_frame, textvariable=self.district_var, values=districts, width=37).grid(row=3, column=1, pady=5)
        
        # Park Type
        ttk.Label(main_frame, text="Park Type").grid(row=4, column=0, sticky=tk.W, pady=5)
        park_types = [t.ten_loai for t in LoaiCongVien.objects.all()]
        self.type_var = tk.StringVar()
        ttk.Combobox(main_frame, textvariable=self.type_var, values=park_types, width=37).grid(row=4, column=1, pady=5)
        
        # Status
        ttk.Label(main_frame, text="Status").grid(row=5, column=0, sticky=tk.W, pady=5)
        statuses = [s.ten_trang_thai for s in TrangThaiCongVien.objects.all()]
        self.status_var = tk.StringVar()
        ttk.Combobox(main_frame, textvariable=self.status_var, values=statuses, width=37).grid(row=5, column=1, pady=5)
        
        # Area
        ttk.Label(main_frame, text="Area (m²)").grid(row=6, column=0, sticky=tk.W, pady=5)
        self.area_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.area_var, width=40).grid(row=6, column=1, pady=5)
        
        # Latitude
        ttk.Label(main_frame, text="Latitude").grid(row=7, column=0, sticky=tk.W, pady=5)
        self.lat_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.lat_var, width=40).grid(row=7, column=1, pady=5)
        
        # Longitude
        ttk.Label(main_frame, text="Longitude").grid(row=8, column=0, sticky=tk.W, pady=5)
        self.lng_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.lng_var, width=40).grid(row=8, column=1, pady=5)
        
        # Phone
        ttk.Label(main_frame, text="Phone").grid(row=9, column=0, sticky=tk.W, pady=5)
        self.phone_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.phone_var, width=40).grid(row=9, column=1, pady=5)
        
        # Email
        ttk.Label(main_frame, text="Email").grid(row=10, column=0, sticky=tk.W, pady=5)
        self.email_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.email_var, width=40).grid(row=10, column=1, pady=5)
        
        # Manager
        ttk.Label(main_frame, text="Manager").grid(row=11, column=0, sticky=tk.W, pady=5)
        self.manager_var = tk.StringVar()
        ttk.Entry(main_frame, textvariable=self.manager_var, width=40).grid(row=11, column=1, pady=5)
        
        # Description
        ttk.Label(main_frame, text="Description").grid(row=12, column=0, sticky=tk.NW, pady=5)
        self.description_text = tk.Text(main_frame, height=4, width=40)
        self.description_text.grid(row=12, column=1, pady=5)
        
        # Checkboxes
        self.open_24_7_var = tk.BooleanVar()
        ttk.Checkbutton(main_frame, text="Open 24/7", variable=self.open_24_7_var).grid(row=13, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        self.free_entry_var = tk.BooleanVar()
        ttk.Checkbutton(main_frame, text="Free Entry", variable=self.free_entry_var).grid(row=14, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=15, column=0, columnspan=2, pady=20)
        
        ttk.Button(button_frame, text="Save", command=self.save_park).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=self.destroy).pack(side=tk.LEFT, padx=5)
    
    def load_park_data(self):
        """Load existing park data"""
        if not self.park:
            return
        
        self.name_var.set(self.park.ten_cong_vien)
        self.code_var.set(self.park.ma_code or '')
        self.address_var.set(self.park.dia_chi or '')
        
        if self.park.ma_quan_huyen:
            self.district_var.set(self.park.ma_quan_huyen.ten_quan_huyen)
        
        if self.park.ma_loai:
            self.type_var.set(self.park.ma_loai.ten_loai)
        
        if self.park.ma_trang_thai:
            self.status_var.set(self.park.ma_trang_thai.ten_trang_thai)
        
        if self.park.dien_tich_m2:
            self.area_var.set(str(self.park.dien_tich_m2))
        
        if self.park.toa_do_trung_tam:
            self.lat_var.set(str(self.park.toa_do_trung_tam[0]))
            self.lng_var.set(str(self.park.toa_do_trung_tam[1]))
        
        self.phone_var.set(self.park.so_dien_thoai or '')
        self.email_var.set(self.park.email or '')
        self.manager_var.set(self.park.don_vi_quan_ly or '')
        self.description_text.insert(1.0, self.park.mo_ta or '')
        self.open_24_7_var.set(self.park.mo_cua_24_7)
        self.free_entry_var.set(self.park.mien_phi_vao_cua)
    
    def save_park(self):
        """Save park to database"""
        try:
            if not self.name_var.get():
                messagebox.showerror("Error", "Park name is required")
                return
            
            if self.park:
                park = self.park
            else:
                park = CongVien()
            
            park.ten_cong_vien = self.name_var.get()
            park.ma_code = self.code_var.get()
            park.dia_chi = self.address_var.get()
            park.mo_cua_24_7 = self.open_24_7_var.get()
            park.mien_phi_vao_cua = self.free_entry_var.get()
            park.don_vi_quan_ly = self.manager_var.get()
            park.so_dien_thoai = self.phone_var.get()
            park.email = self.email_var.get()
            park.mo_ta = self.description_text.get(1.0, tk.END)
            
            if self.area_var.get():
                park.dien_tich_m2 = float(self.area_var.get())
            
            lat = self.lat_var.get()
            lng = self.lng_var.get()
            if lat and lng:
                park.toa_do_trung_tam = [float(lat), float(lng)]
            
            if self.district_var.get():
                try:
                    park.ma_quan_huyen = QuanHuyen.objects.get(ten_quan_huyen=self.district_var.get())
                except:
                    pass
            
            if self.type_var.get():
                try:
                    park.ma_loai = LoaiCongVien.objects.get(ten_loai=self.type_var.get())
                except:
                    pass
            
            if self.status_var.get():
                try:
                    park.ma_trang_thai = TrangThaiCongVien.objects.get(ten_trang_thai=self.status_var.get())
                except:
                    pass
            
            park.save()
            messagebox.showinfo("Success", "Park saved successfully!")
            self.result = True
            self.destroy()
        
        except Exception as e:
            messagebox.showerror("Error", f"Error saving park: {str(e)}")


class GISDesktopApp(tk.Tk):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        
        self.title("🌳 GIS Park Management System")
        self.geometry("1200x700")
        self.minsize(1000, 600)
        
        self.create_menu_bar()
        self.create_widgets()
        self.load_parks()
    
    def create_menu_bar(self):
        """Create menu bar"""
        menubar = tk.Menu(self)
        self.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Import Parks (CSV)", command=self.import_parks)
        file_menu.add_command(label="Export Parks (CSV)", command=self.export_parks)
        file_menu.add_command(label="Backup Database (JSON)", command=self.backup_db)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.quit)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="Validate Data", command=self.validate_data)
        tools_menu.add_command(label="Refresh All", command=self.refresh_all)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="About", command=self.show_about)
    
    def create_widgets(self):
        """Create main widgets"""
        # Title
        title_frame = ttk.Frame(self)
        title_frame.pack(fill=tk.X, padx=10, pady=10)
        
        title = ttk.Label(title_frame, text="🌳 GIS Park Management System", font=("Arial", 16, "bold"))
        title.pack()
        
        # Notebook (tabs)
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Parks Tab
        self.create_parks_tab()
        
        # Trees Tab
        self.create_trees_tab()
        
        # Statistics Tab
        self.create_stats_tab()
    
    def create_parks_tab(self):
        """Create parks management tab"""
        parks_frame = ttk.Frame(self.notebook)
        self.notebook.add(parks_frame, text="🏞️ Parks")
        
        # Search and filter
        search_frame = ttk.Frame(parks_frame)
        search_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(search_frame, text="Search:").pack(side=tk.LEFT, padx=5)
        self.search_var = tk.StringVar()
        self.search_var.trace("w", lambda *args: self.search_parks())
        search_entry = ttk.Entry(search_frame, textvariable=self.search_var, width=30)
        search_entry.pack(side=tk.LEFT, padx=5)
        
        ttk.Label(search_frame, text="District:").pack(side=tk.LEFT, padx=5)
        districts = [d.ten_quan_huyen for d in QuanHuyen.objects.all()]
        self.district_var = tk.StringVar()
        self.district_var.trace("w", lambda *args: self.load_parks())
        district_combo = ttk.Combobox(search_frame, textvariable=self.district_var, 
                                      values=["All"] + districts, width=20)
        district_combo.current(0)
        district_combo.pack(side=tk.LEFT, padx=5)
        
        # Buttons
        button_frame = ttk.Frame(parks_frame)
        button_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Button(button_frame, text="➕ Add Park", command=self.add_park).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="✏️ Edit", command=self.edit_park).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="🗑️ Delete", command=self.delete_park).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="🔄 Refresh", command=self.load_parks).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="📤 Export", command=self.export_parks).pack(side=tk.LEFT, padx=5)
        
        # Parks table
        table_frame = ttk.Frame(parks_frame)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(table_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Treeview
        self.parks_tree = ttk.Treeview(table_frame, 
                                       columns=("ID", "Name", "District", "Type", "Area", "Rating", "Reviews", "Status"),
                                       show="headings",
                                       yscrollcommand=scrollbar.set,
                                       height=20)
        scrollbar.config(command=self.parks_tree.yview)
        
        # Column headings
        self.parks_tree.heading("ID", text="ID")
        self.parks_tree.heading("Name", text="Park Name")
        self.parks_tree.heading("District", text="District")
        self.parks_tree.heading("Type", text="Type")
        self.parks_tree.heading("Area", text="Area (m²)")
        self.parks_tree.heading("Rating", text="Rating")
        self.parks_tree.heading("Reviews", text="Reviews")
        self.parks_tree.heading("Status", text="Status")
        
        # Column widths
        widths = [40, 200, 120, 100, 100, 80, 80, 100]
        for col, width in zip(self.parks_tree["columns"], widths):
            self.parks_tree.column(col, width=width)
        
        self.parks_tree.pack(fill=tk.BOTH, expand=True)
        self.parks_tree.bind("<Double-1>", lambda e: self.edit_park())
    
    def create_trees_tab(self):
        """Create trees tab"""
        trees_frame = ttk.Frame(self.notebook)
        self.notebook.add(trees_frame, text="🌳 Trees")
        
        # Filter
        filter_frame = ttk.Frame(trees_frame)
        filter_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(filter_frame, text="Park:").pack(side=tk.LEFT, padx=5)
        parks = [p.ten_cong_vien for p in CongVien.objects.all()]
        self.trees_park_var = tk.StringVar()
        self.trees_park_var.trace("w", lambda *args: self.load_trees())
        park_combo = ttk.Combobox(filter_frame, textvariable=self.trees_park_var,
                                  values=["All Parks"] + parks, width=30)
        park_combo.current(0)
        park_combo.pack(side=tk.LEFT, padx=5)
        
        ttk.Button(filter_frame, text="🔄 Refresh", command=self.load_trees).pack(side=tk.LEFT, padx=5)
        
        # Trees table
        table_frame = ttk.Frame(trees_frame)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        scrollbar = ttk.Scrollbar(table_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.trees_tree = ttk.Treeview(table_frame,
                                       columns=("ID", "Species", "Park", "Height", "Diameter", "Status", "Planted"),
                                       show="headings",
                                       yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.trees_tree.yview)
        
        for col in self.trees_tree["columns"]:
            self.trees_tree.heading(col, text=col)
            self.trees_tree.column(col, width=100)
        
        self.trees_tree.pack(fill=tk.BOTH, expand=True)
    
    def create_stats_tab(self):
        """Create statistics tab"""
        stats_frame = ttk.Frame(self.notebook)
        self.notebook.add(stats_frame, text="📊 Statistics")
        
        # Stats cards
        cards_frame = ttk.Frame(stats_frame)
        cards_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.total_parks_label = ttk.Label(cards_frame, text="Total Parks: 0", font=("Arial", 12))
        self.total_parks_label.pack(side=tk.LEFT, padx=10)
        
        self.active_parks_label = ttk.Label(cards_frame, text="Active Parks: 0", font=("Arial", 12))
        self.active_parks_label.pack(side=tk.LEFT, padx=10)
        
        self.total_trees_label = ttk.Label(cards_frame, text="Total Trees: 0", font=("Arial", 12))
        self.total_trees_label.pack(side=tk.LEFT, padx=10)
        
        self.total_users_label = ttk.Label(cards_frame, text="Total Users: 0", font=("Arial", 12))
        self.total_users_label.pack(side=tk.LEFT, padx=10)
        
        # Districts table
        table_frame = ttk.Frame(stats_frame)
        table_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        scrollbar = ttk.Scrollbar(table_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.stats_tree = ttk.Treeview(table_frame,
                                       columns=("District", "Parks", "Trees", "Avg Rating"),
                                       show="headings",
                                       yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.stats_tree.yview)
        
        for col in self.stats_tree["columns"]:
            self.stats_tree.heading(col, text=col)
            self.stats_tree.column(col, width=150)
        
        self.stats_tree.pack(fill=tk.BOTH, expand=True)
    
    def load_parks(self):
        """Load parks into table"""
        try:
            # Clear table
            for item in self.parks_tree.get_children():
                self.parks_tree.delete(item)
            
            # Filter
            parks_query = CongVien.objects.select_related('ma_quan_huyen', 'ma_loai', 'ma_trang_thai')
            
            if self.district_var.get() != "All":
                parks_query = parks_query.filter(ma_quan_huyen__ten_quan_huyen=self.district_var.get())
            
            # Add rows
            for park in parks_query:
                district = park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'
                park_type = park.ma_loai.ten_loai if park.ma_loai else 'N/A'
                area = f"{park.dien_tich_m2:,.0f}" if park.dien_tich_m2 else 'N/A'
                status = park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A'
                
                self.parks_tree.insert("", "end", values=(
                    park.ma_cong_vien,
                    park.ten_cong_vien,
                    district,
                    park_type,
                    area,
                    f"{park.diem_trung_binh:.2f}",
                    park.so_luot_danh_gia,
                    status
                ), tags=(park.ma_cong_vien,))
        
        except Exception as e:
            messagebox.showerror("Error", f"Error loading parks: {str(e)}")
    
    def load_trees(self):
        """Load trees into table"""
        try:
            for item in self.trees_tree.get_children():
                self.trees_tree.delete(item)
            
            trees_query = CayXanh.objects.select_related('ma_cong_vien', 'ma_loai_cay')
            
            if self.trees_park_var.get() != "All Parks":
                trees_query = trees_query.filter(ma_cong_vien__ten_cong_vien=self.trees_park_var.get())
            
            for tree in trees_query[:100]:
                park_name = tree.ma_cong_vien.ten_cong_vien if tree.ma_cong_vien else 'N/A'
                species = tree.ma_loai_cay.ten_loai if tree.ma_loai_cay else 'Unknown'
                height = f"{tree.chieu_cao_m:.2f}" if tree.chieu_cao_m else 'N/A'
                diameter = f"{tree.duong_kinh_cm:.2f}" if tree.duong_kinh_cm else 'N/A'
                planted = tree.ngay_trong.strftime('%Y-%m-%d') if tree.ngay_trong else 'N/A'
                
                self.trees_tree.insert("", "end", values=(
                    tree.ma_cay,
                    species,
                    park_name,
                    height,
                    diameter,
                    tree.tinh_trang,
                    planted
                ))
        
        except Exception as e:
            messagebox.showerror("Error", f"Error loading trees: {str(e)}")
    
    def load_stats(self):
        """Load statistics"""
        try:
            from django.db.models import Count, Avg
            
            total_parks = CongVien.objects.count()
            active_parks = CongVien.objects.filter(ma_trang_thai__ma_code='hoat_dong').count()
            total_trees = CayXanh.objects.count()
            total_users = NguoiDung.objects.count()
            
            self.total_parks_label.config(text=f"Total Parks: {total_parks}")
            self.active_parks_label.config(text=f"Active Parks: {active_parks}")
            self.total_trees_label.config(text=f"Total Trees: {total_trees}")
            self.total_users_label.config(text=f"Total Users: {total_users}")
            
            # District stats
            for item in self.stats_tree.get_children():
                self.stats_tree.delete(item)
            
            district_stats = (
                CongVien.objects
                .values('ma_quan_huyen__ten_quan_huyen')
                .annotate(
                    park_count=Count('ma_cong_vien'),
                    tree_count=Count('cay_xanh'),
                    avg_rating=Avg('diem_trung_binh')
                )
                .order_by('-park_count')
            )
            
            for stat in district_stats:
                district_name = stat['ma_quan_huyen__ten_quan_huyen'] or 'Unknown'
                avg_rating = stat['avg_rating'] or 0
                
                self.stats_tree.insert("", "end", values=(
                    district_name,
                    stat['park_count'],
                    stat['tree_count'],
                    f"{avg_rating:.2f}"
                ))
        
        except Exception as e:
            messagebox.showerror("Error", f"Error loading statistics: {str(e)}")
    
    def search_parks(self):
        """Filter parks by search"""
        for item in self.parks_tree.get_children():
            self.parks_tree.delete(item)
        
        parks_query = CongVien.objects.select_related('ma_quan_huyen', 'ma_loai')
        search_text = self.search_var.get().lower()
        
        for park in parks_query:
            if search_text in park.ten_cong_vien.lower():
                district = park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'
                park_type = park.ma_loai.ten_loai if park.ma_loai else 'N/A'
                area = f"{park.dien_tich_m2:,.0f}" if park.dien_tich_m2 else 'N/A'
                status = park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A'
                
                self.parks_tree.insert("", "end", values=(
                    park.ma_cong_vien,
                    park.ten_cong_vien,
                    district,
                    park_type,
                    area,
                    f"{park.diem_trung_binh:.2f}",
                    park.so_luot_danh_gia,
                    status
                ))
    
    def add_park(self):
        """Add new park"""
        dialog = ParkDialog(self)
        if dialog.result:
            self.load_parks()
    
    def edit_park(self):
        """Edit selected park"""
        selected = self.parks_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a park to edit")
            return
        
        park_id = int(self.parks_tree.item(selected[0])["values"][0])
        try:
            park = CongVien.objects.get(ma_cong_vien=park_id)
            dialog = ParkDialog(self, park)
            if dialog.result:
                self.load_parks()
        except:
            messagebox.showerror("Error", "Park not found")
    
    def delete_park(self):
        """Delete selected park"""
        selected = self.parks_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a park to delete")
            return
        
        park_id = int(self.parks_tree.item(selected[0])["values"][0])
        park_name = self.parks_tree.item(selected[0])["values"][1]
        
        if messagebox.askyesno("Confirm", f"Delete '{park_name}'?"):
            try:
                park = CongVien.objects.get(ma_cong_vien=park_id)
                park.delete()
                messagebox.showinfo("Success", "Park deleted!")
                self.load_parks()
            except:
                messagebox.showerror("Error", "Park not found")
    
    def import_parks(self):
        """Import parks from CSV"""
        filepath = filedialog.askopenfilename(filetypes=[("CSV", "*.csv")])
        if not filepath:
            return
        
        try:
            created = 0
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    defaults = {
                        'ten_cong_vien': row.get('name', 'Unnamed'),
                        'dia_chi': row.get('address', ''),
                    }
                    if row.get('area'):
                        defaults['dien_tich_m2'] = float(row['area'])
                    
                    park, created_flag = CongVien.objects.get_or_create(
                        ma_code=row.get('code'),
                        defaults=defaults
                    )
                    if created_flag:
                        created += 1
            
            messagebox.showinfo("Success", f"Imported {created} parks!")
            self.load_parks()
        except Exception as e:
            messagebox.showerror("Error", f"Import error: {str(e)}")
    
    def export_parks(self):
        """Export parks to CSV"""
        filepath = filedialog.asksaveasfilename(filetypes=[("CSV", "*.csv")])
        if not filepath:
            return
        
        try:
            parks = CongVien.objects.all()
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(['ID', 'Name', 'Code', 'District', 'Address', 'Area', 'Type', 'Status', 'Rating', 'Reviews'])
                
                for park in parks:
                    writer.writerow([
                        park.ma_cong_vien,
                        park.ten_cong_vien,
                        park.ma_code or '',
                        park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else '',
                        park.dia_chi or '',
                        park.dien_tich_m2 or '',
                        park.ma_loai.ten_loai if park.ma_loai else '',
                        park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else '',
                        park.diem_trung_binh,
                        park.so_luot_danh_gia
                    ])
            
            messagebox.showinfo("Success", f"Exported to {filepath}")
        except Exception as e:
            messagebox.showerror("Error", f"Export error: {str(e)}")
    
    def backup_db(self):
        """Backup database to JSON"""
        filepath = filedialog.asksaveasfilename(filetypes=[("JSON", "*.json")])
        if not filepath:
            return
        
        try:
            backup = {
                'timestamp': datetime.now().isoformat(),
                'parks': [],
                'trees': []
            }
            
            for park in CongVien.objects.all():
                backup['parks'].append({
                    'id': park.ma_cong_vien,
                    'name': park.ten_cong_vien,
                    'coordinates': park.toa_do_trung_tam,
                })
            
            for tree in CayXanh.objects.all():
                backup['trees'].append({
                    'id': tree.ma_cay,
                    'park_id': tree.ma_cong_vien.ma_cong_vien if tree.ma_cong_vien else None,
                })
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(backup, f, indent=2, ensure_ascii=False)
            
            messagebox.showinfo("Success", f"Backup created!")
        except Exception as e:
            messagebox.showerror("Error", f"Backup error: {str(e)}")
    
    def validate_data(self):
        """Validate data"""
        errors = []
        warnings = []
        
        parks_no_coords = CongVien.objects.filter(toa_do_trung_tam__isnull=True)
        if parks_no_coords.exists():
            warnings.append(f"{parks_no_coords.count()} parks without coordinates")
        
        message = "Validation Results:\n\n"
        if errors:
            message += "Errors:\n" + "\n".join(f"• {e}" for e in errors) + "\n\n"
        if warnings:
            message += "Warnings:\n" + "\n".join(f"• {w}" for w in warnings) + "\n\n"
        if not errors and not warnings:
            message += "✅ All data is valid!"
        
        messagebox.showinfo("Validation", message)
    
    def refresh_all(self):
        """Refresh all data"""
        self.load_parks()
        self.load_trees()
        self.load_stats()
        messagebox.showinfo("Refresh", "All data refreshed!")
    
    def show_about(self):
        """Show about dialog"""
        messagebox.showinfo("About", "GIS Park Management System v1.0\n\n"
                           "Professional desktop application for managing parks and trees.")


if __name__ == "__main__":
    app = GISDesktopApp()
    app.mainloop()
