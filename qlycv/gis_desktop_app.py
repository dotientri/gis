"""
GIS Park Management System - Desktop Application
Ứng dụng desktop hoàn chỉnh để quản lý công viên, cây xanh và dữ liệu địa lý
Built with PyQt5 for professional user interface
"""

import sys
import os
import json
from datetime import datetime
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
import django
django.setup()

from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QTabWidget, QTableWidget, QTableWidgetItem, QPushButton, QLineEdit,
    QComboBox, QLabel, QMessageBox, QDialog, QFormLayout, QSpinBox,
    QDoubleSpinBox, QTextEdit, QDateEdit, QCheckBox, QFileDialog,
    QProgressDialog, QStatusBar, QMenuBar, QMenu, QInputDialog,
    QHeaderView, QAbstractItemView
)
from PyQt5.QtCore import Qt, QThread, QDate, QTimer
from PyQt5.QtGui import QIcon, QFont, QColor, QBrush

from parks.models import (
    CongVien, CayXanh, DanhGiaCongVien, QuanHuyen, PhuongXa,
    LoaiCongVien, TrangThaiCongVien, LoaiTienIch, TienIchCongVien,
    NguoiDung, SuKienCongVien
)


class ParkDialog(QDialog):
    """Dialog for creating/editing parks"""
    
    def __init__(self, parent=None, park=None):
        super().__init__(parent)
        self.park = park
        self.setWindowTitle('Add Park' if not park else 'Edit Park')
        self.setGeometry(100, 100, 600, 700)
        self.init_ui()
        
        if park:
            self.load_park_data()
    
    def init_ui(self):
        layout = QFormLayout()
        
        # Basic Information
        self.name_input = QLineEdit()
        self.code_input = QLineEdit()
        self.address_input = QLineEdit()
        
        # District & Ward
        self.district_combo = QComboBox()
        self.district_combo.addItems([d.ten_quan_huyen for d in QuanHuyen.objects.all()])
        
        # Park Type
        self.type_combo = QComboBox()
        self.type_combo.addItems([''] + [t.ten_loai for t in LoaiCongVien.objects.all()])
        
        # Status
        self.status_combo = QComboBox()
        self.status_combo.addItems([''] + [s.ten_trang_thai for s in TrangThaiCongVien.objects.all()])
        
        # Area
        self.area_input = QDoubleSpinBox()
        self.area_input.setMaximum(10000000)
        self.area_input.setPrefix("Area (m²): ")
        
        # Coordinates
        self.lat_input = QDoubleSpinBox()
        self.lat_input.setRange(-90, 90)
        self.lat_input.setDecimals(6)
        self.lat_input.setPrefix("Latitude: ")
        
        self.lng_input = QDoubleSpinBox()
        self.lng_input.setRange(-180, 180)
        self.lng_input.setDecimals(6)
        self.lng_input.setPrefix("Longitude: ")
        
        # Contact
        self.phone_input = QLineEdit()
        self.email_input = QLineEdit()
        self.manager_input = QLineEdit()
        
        # Description
        self.description_input = QTextEdit()
        self.description_input.setMaximumHeight(100)
        
        # Hours
        self.open_24_7_check = QCheckBox("Open 24/7")
        self.free_entry_check = QCheckBox("Free Entry")
        
        # Build form
        layout.addRow("Park Name:", self.name_input)
        layout.addRow("Code:", self.code_input)
        layout.addRow("Address:", self.address_input)
        layout.addRow("District:", self.district_combo)
        layout.addRow("Park Type:", self.type_combo)
        layout.addRow("Status:", self.status_combo)
        layout.addRow(self.area_input)
        layout.addRow(self.lat_input)
        layout.addRow(self.lng_input)
        layout.addRow("Phone:", self.phone_input)
        layout.addRow("Email:", self.email_input)
        layout.addRow("Manager:", self.manager_input)
        layout.addRow("Description:", self.description_input)
        layout.addRow(self.open_24_7_check)
        layout.addRow(self.free_entry_check)
        
        # Buttons
        button_layout = QHBoxLayout()
        save_btn = QPushButton("Save")
        cancel_btn = QPushButton("Cancel")
        save_btn.clicked.connect(self.save_park)
        cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(save_btn)
        button_layout.addWidget(cancel_btn)
        
        layout.addRow(button_layout)
        self.setLayout(layout)
    
    def load_park_data(self):
        """Load existing park data into form"""
        if not self.park:
            return
        
        self.name_input.setText(self.park.ten_cong_vien)
        self.code_input.setText(self.park.ma_code or '')
        self.address_input.setText(self.park.dia_chi or '')
        
        if self.park.ma_quan_huyen:
            index = self.district_combo.findText(self.park.ma_quan_huyen.ten_quan_huyen)
            self.district_combo.setCurrentIndex(index)
        
        if self.park.ma_loai:
            index = self.type_combo.findText(self.park.ma_loai.ten_loai)
            self.type_combo.setCurrentIndex(index)
        
        if self.park.ma_trang_thai:
            index = self.status_combo.findText(self.park.ma_trang_thai.ten_trang_thai)
            self.status_combo.setCurrentIndex(index)
        
        if self.park.dien_tich_m2:
            self.area_input.setValue(float(self.park.dien_tich_m2))
        
        if self.park.toa_do_trung_tam:
            self.lat_input.setValue(self.park.toa_do_trung_tam[0])
            self.lng_input.setValue(self.park.toa_do_trung_tam[1])
        
        self.phone_input.setText(self.park.so_dien_thoai or '')
        self.email_input.setText(self.park.email or '')
        self.manager_input.setText(self.park.don_vi_quan_ly or '')
        self.description_input.setText(self.park.mo_ta or '')
        self.open_24_7_check.setChecked(self.park.mo_cua_24_7)
        self.free_entry_check.setChecked(self.park.mien_phi_vao_cua)
    
    def save_park(self):
        """Save park to database"""
        try:
            if not self.name_input.text():
                QMessageBox.warning(self, "Error", "Park name is required")
                return
            
            if self.park:
                # Update existing
                park = self.park
            else:
                # Create new
                park = CongVien()
            
            park.ten_cong_vien = self.name_input.text()
            park.ma_code = self.code_input.text()
            park.dia_chi = self.address_input.text()
            park.dien_tich_m2 = Decimal(str(self.area_input.value()))
            park.mo_cua_24_7 = self.open_24_7_check.isChecked()
            park.mien_phi_vao_cua = self.free_entry_check.isChecked()
            park.don_vi_quan_ly = self.manager_input.text()
            park.so_dien_thoai = self.phone_input.text()
            park.email = self.email_input.text()
            park.mo_ta = self.description_input.toPlainText()
            
            # Coordinates
            lat = self.lat_input.value()
            lng = self.lng_input.value()
            if lat != 0 or lng != 0:
                park.toa_do_trung_tam = [lat, lng]
            
            # Relations
            if self.district_combo.currentText():
                try:
                    park.ma_quan_huyen = QuanHuyen.objects.get(
                        ten_quan_huyen=self.district_combo.currentText()
                    )
                except:
                    pass
            
            if self.type_combo.currentText():
                try:
                    park.ma_loai = LoaiCongVien.objects.get(
                        ten_loai=self.type_combo.currentText()
                    )
                except:
                    pass
            
            if self.status_combo.currentText():
                try:
                    park.ma_trang_thai = TrangThaiCongVien.objects.get(
                        ten_trang_thai=self.status_combo.currentText()
                    )
                except:
                    pass
            
            park.save()
            QMessageBox.information(self, "Success", "Park saved successfully!")
            self.accept()
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Error saving park: {str(e)}")


class ParkManagementTab(QWidget):
    """Tab for managing parks"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.load_parks()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Search and filter
        search_layout = QHBoxLayout()
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search parks by name...")
        self.search_input.textChanged.connect(self.search_parks)
        
        self.district_filter = QComboBox()
        self.district_filter.addItem("All Districts")
        self.district_filter.addItems([d.ten_quan_huyen for d in QuanHuyen.objects.all()])
        self.district_filter.currentTextChanged.connect(self.load_parks)
        
        search_layout.addWidget(QLabel("Search:"))
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(QLabel("District:"))
        search_layout.addWidget(self.district_filter)
        
        # Button bar
        button_layout = QHBoxLayout()
        
        add_btn = QPushButton("➕ Add Park")
        add_btn.clicked.connect(self.add_park)
        
        edit_btn = QPushButton("✏️ Edit")
        edit_btn.clicked.connect(self.edit_park)
        
        delete_btn = QPushButton("🗑️ Delete")
        delete_btn.clicked.connect(self.delete_park)
        
        refresh_btn = QPushButton("🔄 Refresh")
        refresh_btn.clicked.connect(self.load_parks)
        
        export_btn = QPushButton("📤 Export")
        export_btn.clicked.connect(self.export_parks)
        
        button_layout.addWidget(add_btn)
        button_layout.addWidget(edit_btn)
        button_layout.addWidget(delete_btn)
        button_layout.addWidget(refresh_btn)
        button_layout.addWidget(export_btn)
        button_layout.addStretch()
        
        # Parks table
        self.parks_table = QTableWidget()
        self.parks_table.setColumnCount(8)
        self.parks_table.setHorizontalHeaderLabels([
            'ID', 'Name', 'District', 'Type', 'Area (m²)', 'Rating', 'Reviews', 'Status'
        ])
        self.parks_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.Stretch)
        self.parks_table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.parks_table.setSelectionMode(QAbstractItemView.SingleSelection)
        self.parks_table.doubleClicked.connect(self.edit_park)
        
        # Build layout
        layout.addLayout(search_layout)
        layout.addLayout(button_layout)
        layout.addWidget(self.parks_table)
        
        self.setLayout(layout)
    
    def load_parks(self):
        """Load parks from database"""
        try:
            parks_query = CongVien.objects.select_related(
                'ma_quan_huyen', 'ma_loai', 'ma_trang_thai'
            )
            
            # Filter by district
            if self.district_filter.currentText() != "All Districts":
                parks_query = parks_query.filter(
                    ma_quan_huyen__ten_quan_huyen=self.district_filter.currentText()
                )
            
            self.parks_table.setRowCount(0)
            
            for row, park in enumerate(parks_query):
                self.parks_table.insertRow(row)
                
                # ID
                self.parks_table.setItem(row, 0, QTableWidgetItem(str(park.ma_cong_vien)))
                
                # Name
                self.parks_table.setItem(row, 1, QTableWidgetItem(park.ten_cong_vien))
                
                # District
                district = park.ma_quan_huyen.ten_quan_huyen if park.ma_quan_huyen else 'N/A'
                self.parks_table.setItem(row, 2, QTableWidgetItem(district))
                
                # Type
                park_type = park.ma_loai.ten_loai if park.ma_loai else 'N/A'
                self.parks_table.setItem(row, 3, QTableWidgetItem(park_type))
                
                # Area
                area = f"{park.dien_tich_m2:,.0f}" if park.dien_tich_m2 else 'N/A'
                self.parks_table.setItem(row, 4, QTableWidgetItem(area))
                
                # Rating
                self.parks_table.setItem(row, 5, QTableWidgetItem(f"{park.diem_trung_binh:.2f}"))
                
                # Reviews
                self.parks_table.setItem(row, 6, QTableWidgetItem(str(park.so_luot_danh_gia)))
                
                # Status
                status = park.ma_trang_thai.ten_trang_thai if park.ma_trang_thai else 'N/A'
                self.parks_table.setItem(row, 7, QTableWidgetItem(status))
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Error loading parks: {str(e)}")
    
    def search_parks(self):
        """Filter parks by search text"""
        search_text = self.search_input.text().lower()
        
        for row in range(self.parks_table.rowCount()):
            park_name = self.parks_table.item(row, 1).text().lower()
            show = search_text in park_name
            self.parks_table.setRowHidden(row, not show)
    
    def add_park(self):
        """Open dialog to add new park"""
        dialog = ParkDialog(self)
        if dialog.exec_() == QDialog.Accepted:
            self.load_parks()
    
    def edit_park(self):
        """Edit selected park"""
        selected_rows = self.parks_table.selectionModel().selectedRows()
        if not selected_rows:
            QMessageBox.warning(self, "Warning", "Please select a park to edit")
            return
        
        park_id = int(self.parks_table.item(selected_rows[0].row(), 0).text())
        try:
            park = CongVien.objects.get(ma_cong_vien=park_id)
            dialog = ParkDialog(self, park)
            if dialog.exec_() == QDialog.Accepted:
                self.load_parks()
        except CongVien.DoesNotExist:
            QMessageBox.critical(self, "Error", "Park not found")
    
    def delete_park(self):
        """Delete selected park"""
        selected_rows = self.parks_table.selectionModel().selectedRows()
        if not selected_rows:
            QMessageBox.warning(self, "Warning", "Please select a park to delete")
            return
        
        park_id = int(self.parks_table.item(selected_rows[0].row(), 0).text())
        park_name = self.parks_table.item(selected_rows[0].row(), 1).text()
        
        reply = QMessageBox.question(
            self, "Confirm Delete",
            f"Are you sure you want to delete '{park_name}'?",
            QMessageBox.Yes | QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            try:
                park = CongVien.objects.get(ma_cong_vien=park_id)
                park.delete()
                QMessageBox.information(self, "Success", "Park deleted successfully!")
                self.load_parks()
            except CongVien.DoesNotExist:
                QMessageBox.critical(self, "Error", "Park not found")
    
    def export_parks(self):
        """Export parks to CSV"""
        filepath, _ = QFileDialog.getSaveFileName(
            self, "Export Parks", "", "CSV Files (*.csv)"
        )
        
        if not filepath:
            return
        
        try:
            import csv
            parks = CongVien.objects.all()
            
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'ID', 'Name', 'Code', 'District', 'Address', 'Area', 
                    'Type', 'Status', 'Rating', 'Reviews'
                ])
                
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
            
            QMessageBox.information(self, "Success", f"Parks exported to {filepath}")
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Export error: {str(e)}")


class StatisticsTab(QWidget):
    """Tab for viewing statistics"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.load_statistics()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Stats cards
        stats_layout = QHBoxLayout()
        
        self.total_parks_label = QLabel()
        self.active_parks_label = QLabel()
        self.total_trees_label = QLabel()
        self.total_users_label = QLabel()
        
        for label in [self.total_parks_label, self.active_parks_label, 
                      self.total_trees_label, self.total_users_label]:
            label.setStyleSheet("border: 1px solid #ccc; padding: 20px; border-radius: 5px;")
            label.setAlignment(Qt.AlignCenter)
            stats_layout.addWidget(label)
        
        # Districts table
        self.districts_table = QTableWidget()
        self.districts_table.setColumnCount(4)
        self.districts_table.setHorizontalHeaderLabels(['District', 'Parks', 'Trees', 'Avg Rating'])
        self.districts_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        
        layout.addLayout(stats_layout)
        layout.addWidget(self.districts_table)
        
        self.setLayout(layout)
    
    def load_statistics(self):
        """Load and display statistics"""
        try:
            from django.db.models import Count, Avg
            
            # Total statistics
            total_parks = CongVien.objects.count()
            active_parks = CongVien.objects.filter(ma_trang_thai__ma_code='hoat_dong').count()
            total_trees = CayXanh.objects.count()
            total_users = NguoiDung.objects.count()
            
            self.total_parks_label.setText(f"📊 Total Parks\n{total_parks}")
            self.active_parks_label.setText(f"✅ Active Parks\n{active_parks}")
            self.total_trees_label.setText(f"🌳 Total Trees\n{total_trees}")
            self.total_users_label.setText(f"👥 Users\n{total_users}")
            
            # District statistics
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
            
            self.districts_table.setRowCount(0)
            
            for row, stat in enumerate(district_stats):
                self.districts_table.insertRow(row)
                
                district_name = stat['ma_quan_huyen__ten_quan_huyen'] or 'Unknown'
                self.districts_table.setItem(row, 0, QTableWidgetItem(district_name))
                self.districts_table.setItem(row, 1, QTableWidgetItem(str(stat['park_count'])))
                self.districts_table.setItem(row, 2, QTableWidgetItem(str(stat['tree_count'])))
                
                avg_rating = stat['avg_rating'] or 0
                self.districts_table.setItem(row, 3, QTableWidgetItem(f"{avg_rating:.2f}"))
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Error loading statistics: {str(e)}")


class TreesTab(QWidget):
    """Tab for managing trees"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.load_trees()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Filter
        filter_layout = QHBoxLayout()
        
        self.park_filter = QComboBox()
        self.park_filter.addItem("All Parks")
        self.park_filter.addItems([p.ten_cong_vien for p in CongVien.objects.all()])
        self.park_filter.currentTextChanged.connect(self.load_trees)
        
        search_btn = QPushButton("🔄 Refresh")
        search_btn.clicked.connect(self.load_trees)
        
        filter_layout.addWidget(QLabel("Park:"))
        filter_layout.addWidget(self.park_filter)
        filter_layout.addWidget(search_btn)
        filter_layout.addStretch()
        
        # Trees table
        self.trees_table = QTableWidget()
        self.trees_table.setColumnCount(7)
        self.trees_table.setHorizontalHeaderLabels([
            'ID', 'Species', 'Park', 'Height', 'Diameter', 'Status', 'Planted'
        ])
        
        layout.addLayout(filter_layout)
        layout.addWidget(self.trees_table)
        
        self.setLayout(layout)
    
    def load_trees(self):
        """Load trees from database"""
        try:
            trees_query = CayXanh.objects.select_related('ma_cong_vien', 'ma_loai_cay')
            
            if self.park_filter.currentText() != "All Parks":
                trees_query = trees_query.filter(
                    ma_cong_vien__ten_cong_vien=self.park_filter.currentText()
                )
            
            self.trees_table.setRowCount(0)
            
            for row, tree in enumerate(trees_query[:100]):  # Limit to 100
                self.trees_table.insertRow(row)
                
                self.trees_table.setItem(row, 0, QTableWidgetItem(str(tree.ma_cay)))
                self.trees_table.setItem(row, 1, QTableWidgetItem(
                    tree.ma_loai_cay.ten_loai if tree.ma_loai_cay else 'Unknown'
                ))
                self.trees_table.setItem(row, 2, QTableWidgetItem(
                    tree.ma_cong_vien.ten_cong_vien if tree.ma_cong_vien else 'N/A'
                ))
                self.trees_table.setItem(row, 3, QTableWidgetItem(
                    f"{tree.chieu_cao_m:.2f}" if tree.chieu_cao_m else 'N/A'
                ))
                self.trees_table.setItem(row, 4, QTableWidgetItem(
                    f"{tree.duong_kinh_cm:.2f}" if tree.duong_kinh_cm else 'N/A'
                ))
                self.trees_table.setItem(row, 5, QTableWidgetItem(tree.tinh_trang))
                self.trees_table.setItem(row, 6, QTableWidgetItem(
                    tree.ngay_trong.strftime('%Y-%m-%d') if tree.ngay_trong else 'N/A'
                ))
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Error loading trees: {str(e)}")


class MainWindow(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("GIS Park Management System")
        self.setGeometry(100, 100, 1400, 900)
        
        # Set application icon and style
        self.set_style()
        
        # Create menu bar
        self.create_menu_bar()
        
        # Create main widget
        main_widget = QWidget()
        main_layout = QVBoxLayout()
        
        # Title
        title = QLabel("🌳 GIS Park Management System")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title.setFont(title_font)
        
        # Tabs
        self.tabs = QTabWidget()
        
        # Add tabs
        self.parks_tab = ParkManagementTab()
        self.stats_tab = StatisticsTab()
        self.trees_tab = TreesTab()
        
        self.tabs.addTab(self.parks_tab, "🏞️ Parks")
        self.tabs.addTab(self.trees_tab, "🌳 Trees")
        self.tabs.addTab(self.stats_tab, "📊 Statistics")
        
        # Build layout
        main_layout.addWidget(title)
        main_layout.addWidget(self.tabs)
        
        main_widget.setLayout(main_layout)
        self.setCentralWidget(main_widget)
        
        # Status bar
        self.statusBar = QStatusBar()
        self.setStatusBar(self.statusBar)
        self.statusBar.showMessage("Ready")
        
        # Load initial data
        self.refresh_all()
    
    def create_menu_bar(self):
        """Create application menu bar"""
        menubar = self.menuBar()
        
        # File menu
        file_menu = menubar.addMenu("File")
        
        import_action = file_menu.addAction("Import Parks (CSV)")
        import_action.triggered.connect(self.import_parks)
        
        export_action = file_menu.addAction("Export Parks (CSV)")
        export_action.triggered.connect(self.export_data)
        
        backup_action = file_menu.addAction("Backup Database (JSON)")
        backup_action.triggered.connect(self.backup_database)
        
        file_menu.addSeparator()
        
        exit_action = file_menu.addAction("Exit")
        exit_action.triggered.connect(self.close)
        
        # Tools menu
        tools_menu = menubar.addMenu("Tools")
        
        validate_action = tools_menu.addAction("Validate Data")
        validate_action.triggered.connect(self.validate_data)
        
        cleanup_action = tools_menu.addAction("Cleanup Old Data")
        cleanup_action.triggered.connect(self.cleanup_data)
        
        # Help menu
        help_menu = menubar.addMenu("Help")
        
        about_action = help_menu.addAction("About")
        about_action.triggered.connect(self.show_about)
    
    def set_style(self):
        """Set application stylesheet"""
        style = """
            QMainWindow {
                background-color: #f5f5f5;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
            QTabBar::tab {
                background-color: #e0e0e0;
                padding: 8px 20px;
                border: 1px solid #999;
            }
            QTabBar::tab:selected {
                background-color: #4CAF50;
                color: white;
            }
            QTableWidget {
                gridline-color: #ddd;
                background-color: white;
            }
            QHeaderView::section {
                background-color: #4CAF50;
                color: white;
                padding: 5px;
                border: none;
            }
        """
        self.setStyleSheet(style)
    
    def import_parks(self):
        """Import parks from CSV file"""
        filepath, _ = QFileDialog.getOpenFileName(
            self, "Import Parks", "", "CSV Files (*.csv)"
        )
        
        if not filepath:
            return
        
        try:
            import csv
            from decimal import Decimal
            
            created = 0
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    park_defaults = {
                        'ten_cong_vien': row.get('name', 'Unnamed'),
                        'dia_chi': row.get('address', ''),
                        'dien_tich_m2': Decimal(row.get('area', 0)) if row.get('area') else None,
                    }
                    
                    park, created_flag = CongVien.objects.get_or_create(
                        ma_code=row.get('code'),
                        defaults=park_defaults
                    )
                    
                    if created_flag:
                        created += 1
            
            QMessageBox.information(self, "Success", f"Imported {created} parks")
            self.refresh_all()
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Import error: {str(e)}")
    
    def export_data(self):
        """Export all parks to CSV"""
        self.parks_tab.export_parks()
    
    def backup_database(self):
        """Create JSON backup of database"""
        filepath, _ = QFileDialog.getSaveFileName(
            self, "Backup Database", "", "JSON Files (*.json)"
        )
        
        if not filepath:
            return
        
        try:
            import json
            
            backup_data = {
                'timestamp': datetime.now().isoformat(),
                'parks': [],
                'trees': [],
                'metadata': {'version': '1.0'}
            }
            
            for park in CongVien.objects.all():
                backup_data['parks'].append({
                    'id': park.ma_cong_vien,
                    'name': park.ten_cong_vien,
                    'code': park.ma_code,
                    'coordinates': park.toa_do_trung_tam,
                    'area': float(park.dien_tich_m2) if park.dien_tich_m2 else None,
                })
            
            for tree in CayXanh.objects.all():
                backup_data['trees'].append({
                    'id': tree.ma_cay,
                    'park_id': tree.ma_cong_vien.ma_cong_vien if tree.ma_cong_vien else None,
                })
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            QMessageBox.information(self, "Success", f"Database backed up to {filepath}")
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Backup error: {str(e)}")
    
    def validate_data(self):
        """Validate data integrity"""
        try:
            from django.db.models import F, Q
            
            errors = []
            warnings = []
            
            # Check for parks without coordinates
            parks_no_coords = CongVien.objects.filter(toa_do_trung_tam__isnull=True)
            if parks_no_coords.exists():
                warnings.append(f"{parks_no_coords.count()} parks without coordinates")
            
            # Check for invalid ratings
            parks_invalid_rating = CongVien.objects.filter(
                Q(diem_trung_binh__lt=0) | Q(diem_trung_binh__gt=5)
            )
            if parks_invalid_rating.exists():
                errors.append(f"{parks_invalid_rating.count()} parks with invalid ratings")
            
            message = "Validation Results:\n\n"
            
            if errors:
                message += "❌ Errors:\n" + "\n".join(f"• {e}" for e in errors) + "\n\n"
            
            if warnings:
                message += "⚠️ Warnings:\n" + "\n".join(f"• {w}" for w in warnings) + "\n\n"
            
            if not errors and not warnings:
                message += "✅ All data is valid!"
            
            QMessageBox.information(self, "Data Validation", message)
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Validation error: {str(e)}")
    
    def cleanup_data(self):
        """Clean up old data"""
        days, ok = QInputDialog.getInt(
            self, "Cleanup Data", "Delete ratings older than (days):", 30
        )
        
        if not ok:
            return
        
        try:
            from datetime import timedelta
            from django.utils import timezone
            
            cutoff_date = timezone.now() - timedelta(days=days)
            deleted = DanhGiaCongVien.objects.filter(ngay_tao__lt=cutoff_date).delete()[0]
            
            QMessageBox.information(self, "Success", f"Deleted {deleted} old ratings")
        
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Cleanup error: {str(e)}")
    
    def refresh_all(self):
        """Refresh all tabs"""
        self.parks_tab.load_parks()
        self.stats_tab.load_statistics()
        self.trees_tab.load_trees()
        self.statusBar.showMessage("Data refreshed")
    
    def show_about(self):
        """Show about dialog"""
        QMessageBox.about(
            self,
            "About GIS Park Management System",
            "GIS Park Management System v1.0\n\n"
            "A professional desktop application for managing parks, trees, and geographic data.\n\n"
            "Created for GIS course assignment\n"
            "© 2026"
        )


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
