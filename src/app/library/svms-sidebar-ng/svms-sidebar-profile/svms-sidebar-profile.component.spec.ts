import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SvmsSidebarProfileComponent } from './svms-sidebar-profile.component';

describe('SvmsSidebarProfileComponent', () => {
  let component: SvmsSidebarProfileComponent;
  let fixture: ComponentFixture<SvmsSidebarProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
