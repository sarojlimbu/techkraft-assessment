import { Component } from '@angular/core';

@Component({
  selector: 'app-security-csp',
  standalone: true,
  templateUrl: './security-csp.html',
  styleUrl: './security-csp.scss',
})
export class SecurityCspComponent {
  readonly examplePolicy = `Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self';`;
}
