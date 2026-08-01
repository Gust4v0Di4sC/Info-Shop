import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-special-offer',
  templateUrl: './special-offer.component.html',
  styleUrls: ['./special-offer.component.scss']
})
export class SpecialOfferComponent implements OnInit, OnDestroy {
  countdown: string = '';
  private intervalId: any;

  ngOnInit(): void {
    const targetTime = new Date().getTime() + 1000 * 60 * 50; // 50 minutos
    this.updateCountdown(targetTime);
    this.intervalId = setInterval(() => this.updateCountdown(targetTime), 1000);
  }

  updateCountdown(target: number) {
    const now = new Date().getTime();
    const distance = target - now;

    if (distance <= 0) {
      this.countdown = "00:00:00";
      clearInterval(this.intervalId);
      return;
    }

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.countdown = `00:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number): string {
    return num < 10 ? '0' + num : '' + num;
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
