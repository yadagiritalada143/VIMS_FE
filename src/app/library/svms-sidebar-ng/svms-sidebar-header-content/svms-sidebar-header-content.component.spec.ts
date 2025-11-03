import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SvmsSidebarHeaderContentComponent } from './svms-sidebar-header-content.component';

describe('SvmsSidebarHeaderContentComponent', () => {
  let component: SvmsSidebarHeaderContentComponent;
  let fixture: ComponentFixture<SvmsSidebarHeaderContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsSidebarHeaderContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsSidebarHeaderContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
