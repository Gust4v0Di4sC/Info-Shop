import { inject, Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';

const MOBILE_QUERY = '(max-width: 599.98px)';
const TABLET_QUERY = '(min-width: 600px) and (max-width: 959.98px)';
const COMPACT_QUERY = '(max-width: 959.98px)';
const LARGE_DESKTOP_QUERY = '(min-width: 1280px)';

@Injectable({ providedIn: 'root' })
export class ResponsiveLayoutService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = this.createBreakpointSignal(MOBILE_QUERY);
  readonly isTablet = this.createBreakpointSignal(TABLET_QUERY);
  readonly isCompact = this.createBreakpointSignal(COMPACT_QUERY);
  readonly isLargeDesktop = this.createBreakpointSignal(LARGE_DESKTOP_QUERY);

  private createBreakpointSignal(query: string) {
    return toSignal(
      this.breakpointObserver.observe(query).pipe(
        map(result => result.matches),
        distinctUntilChanged(),
      ),
      { initialValue: this.breakpointObserver.isMatched(query) },
    );
  }
}
