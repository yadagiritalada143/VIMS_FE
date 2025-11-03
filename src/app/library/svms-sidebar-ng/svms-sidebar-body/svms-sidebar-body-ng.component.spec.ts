import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsSidebarBodyNgComponent } from './svms-sidebar-body-ng.component'

describe('SvmsSidebarBodyComponent', () => {
  let component: SvmsSidebarBodyNgComponent;
  let fixture: ComponentFixture<SvmsSidebarBodyNgComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarBodyNgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarBodyNgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
