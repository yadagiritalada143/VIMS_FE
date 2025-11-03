import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VMSRowComponent } from './row.component';

describe('VMSRowComponent', () => {
  let component: VMSRowComponent;
  let fixture: ComponentFixture<VMSRowComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [VMSRowComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VMSRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
