import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsSidebarNavComponent } from './svms-sidebar-nav.component';

describe('SvmsSidebarNavComponent', () => {
  let component: SvmsSidebarNavComponent;
  let fixture: ComponentFixture<SvmsSidebarNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
