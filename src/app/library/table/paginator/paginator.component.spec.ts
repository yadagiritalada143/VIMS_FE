import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VMSPaginatorComponent } from './paginator.component';

describe('VMSPaginatorComponent', () => {
  let component: VMSPaginatorComponent;
  let fixture: ComponentFixture<VMSPaginatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [VMSPaginatorComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VMSPaginatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
