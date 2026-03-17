import { Component } from '@angular/core';
import { DemoHeader } from './components/demo-header/demo-header';
import { DemoButton } from './components/demo-button/demo-button';
import { DemoCard } from './components/demo-card/demo-card';
import { DemoText } from './components/demo-text/demo-text';

@Component({
  selector: 'app-root',
  imports: [DemoHeader, DemoButton, DemoCard, DemoText],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'angular-app';
}
