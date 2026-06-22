import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { RentaService } from '../../services/renta.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())], // <-- Esto es vital para que Chart.js inicie
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  
  public pieChartOptions: ChartConfiguration<'pie'>['options'] = { 
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  };
  
  public pieChartLabels = ['En Ruta (Abiertas)', 'Concluidas'];
  public pieChartDatasets = [{ data: [0, 0] }];

  constructor(private rentaService: RentaService) {}

ngOnInit(): void {
    // Le decimos explícitamente que 'data' es un array de tipo 'any[]'
    this.rentaService.getRentas().subscribe((data: any[]) => {
      // Y le decimos que 'r' es de tipo 'any'
      const abiertas = data.filter((r: any) => r.estado === 'Abierta').length;
      const concluidas = data.filter((r: any) => r.estado !== 'Abierta').length;
      
      this.pieChartDatasets = [{ data: [abiertas, concluidas] }];
    });
  }
}