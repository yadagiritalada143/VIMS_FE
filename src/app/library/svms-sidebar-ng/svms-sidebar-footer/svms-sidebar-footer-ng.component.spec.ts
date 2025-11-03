import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsSidebarFooterNgComponent } from './svms-sidebar-footer-ng.component';

describe('SvmsSidebarFooterComponent', () => {
  let component: SvmsSidebarFooterNgComponent;
  let fixture: ComponentFixture<SvmsSidebarFooterNgComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarFooterNgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarFooterNgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
