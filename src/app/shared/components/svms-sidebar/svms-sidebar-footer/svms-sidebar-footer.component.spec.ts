import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsSidebarFooterComponent } from './svms-sidebar-footer.component';

describe('SvmsSidebarFooterComponent', () => {
  let component: SvmsSidebarFooterComponent;
  let fixture: ComponentFixture<SvmsSidebarFooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
