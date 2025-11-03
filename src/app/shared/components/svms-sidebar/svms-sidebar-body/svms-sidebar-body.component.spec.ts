import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsSidebarBodyComponent } from './svms-sidebar-body.component';

describe('SvmsSidebarBodyComponent', () => {
  let component: SvmsSidebarBodyComponent;
  let fixture: ComponentFixture<SvmsSidebarBodyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarBodyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
