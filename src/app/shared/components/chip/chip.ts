import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [MatChipsModule],
  styleUrl: './chip.scss',
  templateUrl: './chip.html',
})
export class ChipComponent {
  @Input() label = '';
  @Input() tone: string = 'neutral';
  @Input() backgroundColor = '';
  @Input() textColor = '';
  @Input() fontSize = '0.72rem';
  @Input() fontWeight = '700';
}
