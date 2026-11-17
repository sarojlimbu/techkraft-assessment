import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatCardModule],
  styleUrl: './card.scss',
  templateUrl: './card.html',
})
export class Card {}
